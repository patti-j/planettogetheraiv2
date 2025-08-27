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
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-1">
          <Palette className="w-3 h-3 text-purple-600" />
          <span className="text-xs font-medium">Design Studio</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* AI Button - More Compact */}
      <div className="p-2 border-b">
        <Button
          onClick={onAiAssistant}
          size="sm"
          className="w-full h-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] py-1"
        >
          <Sparkles className="w-2 h-2 mr-1" />
          AI Assistant
        </Button>
      </div>

      {/* Compact Tab Bar */}
      <div className="flex border-b bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex-1 py-2 px-1 text-[10px] ${
            activeTab === 'widgets' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Component className="w-2 h-2 mx-auto mb-1" />
          Widgets
        </button>
        <button
          onClick={() => setActiveTab('dashboards')}
          className={`flex-1 py-2 px-1 text-[10px] ${
            activeTab === 'dashboards' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <BarChart3 className="w-2 h-2 mx-auto mb-1" />
          Dashboards
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-2 px-1 text-[10px] ${
            activeTab === 'pages' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Layout className="w-2 h-2 mx-auto mb-1" />
          Pages
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-2 px-1 text-[10px] ${
            activeTab === 'menu' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Settings className="w-2 h-2 mx-auto mb-1" />
          Menu
        </button>
      </div>

      {/* Ultra Compact Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'widgets' && (
          <div className="space-y-2">
            {filteredWidgetTemplates.slice(0, 6).map((template) => (
              <div key={template.id} className="bg-gray-50 dark:bg-gray-800 rounded p-2 border">
                <div className="text-[10px] font-medium mb-1 truncate">{template.name}</div>
                <div className="text-[8px] text-gray-500 mb-2 line-clamp-2">{template.description}</div>
                <Button 
                  size="sm" 
                  onClick={() => onCreateWidget(template)}
                  className="w-full h-5 text-[8px] py-0"
                >
                  <Plus className="w-2 h-2 mr-1" />
                  Create
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dashboards' && (
          <div className="space-y-2">
            {filteredDashboardTemplates.slice(0, 4).map((template) => (
              <div key={template.id} className="bg-gray-50 dark:bg-gray-800 rounded p-2 border">
                <div className="text-[10px] font-medium mb-1 truncate">{template.name}</div>
                <div className="text-[8px] text-gray-500 mb-2 line-clamp-2">{template.description}</div>
                <Button 
                  size="sm" 
                  onClick={() => onCreateDashboard(template)}
                  className="w-full h-5 text-[8px] py-0"
                >
                  <Plus className="w-2 h-2 mr-1" />
                  Create
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="text-center py-6 text-gray-500">
            <Layout className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-[10px]">Coming Soon</p>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="text-center py-6 text-gray-500">
            <Settings className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-[10px]">Coming Soon</p>
          </div>
        )}
      </div>
    </div>
  );
}