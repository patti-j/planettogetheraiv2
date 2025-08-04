import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Component, 
  BarChart3, 
  Layout, 
  Settings, 
  Bot, 
  Plus, 
  X, 
  Palette 
} from 'lucide-react';

interface MobileDesignStudioProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
  onAiAssistant: () => void;
  filteredWidgetTemplates: any[];
  filteredDashboardTemplates: any[];
  onCreateWidget: (template: any) => void;
  onCreateDashboard: (template: any) => void;
}

export function MobileDesignStudio({
  activeTab,
  setActiveTab,
  onClose,
  onAiAssistant,
  filteredWidgetTemplates,
  filteredDashboardTemplates,
  onCreateWidget,
  onCreateDashboard
}: MobileDesignStudioProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-semibold">Design Studio</h2>
          <button 
            onClick={onClose}
            className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Assistant Button */}
      <div className="px-3 py-2 border-b flex-shrink-0">
        <Button
          onClick={onAiAssistant}
          size="sm"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs"
        >
          <Bot className="w-3 h-3 mr-1" />
          AI Assistant
        </Button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 p-2 border-b flex-shrink-0">
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex flex-col items-center py-2 px-1 rounded text-xs ${
            activeTab === 'widgets' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Component className="w-3 h-3 mb-1" />
          Widgets
        </button>
        <button
          onClick={() => setActiveTab('dashboards')}
          className={`flex flex-col items-center py-2 px-1 rounded text-xs ${
            activeTab === 'dashboards' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <BarChart3 className="w-3 h-3 mb-1" />
          Dashboards
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex flex-col items-center py-2 px-1 rounded text-xs ${
            activeTab === 'pages' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Layout className="w-3 h-3 mb-1" />
          Pages
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center py-2 px-1 rounded text-xs ${
            activeTab === 'menu' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Settings className="w-3 h-3 mb-1" />
          Menu
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'widgets' && (
          <div className="space-y-3">
            {filteredWidgetTemplates.map((template) => (
              <Card key={template.id} className="text-xs">
                <CardContent className="p-3">
                  <div className="font-medium mb-1">{template.name}</div>
                  <div className="text-muted-foreground mb-2 text-[10px]">
                    {template.description}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onCreateWidget(template)}
                    className="w-full h-7 text-[10px]"
                  >
                    <Plus className="w-2 h-2 mr-1" />
                    Create
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'dashboards' && (
          <div className="space-y-3">
            {filteredDashboardTemplates.map((template) => (
              <Card key={template.id} className="text-xs">
                <CardContent className="p-3">
                  <div className="font-medium mb-1">{template.name}</div>
                  <div className="text-muted-foreground mb-2 text-[10px]">
                    {template.description}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onCreateDashboard(template)}
                    className="w-full h-7 text-[10px]"
                  >
                    <Plus className="w-2 h-2 mr-1" />
                    Create
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="text-center py-8 text-muted-foreground">
            <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Page management coming soon</p>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Menu management coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}