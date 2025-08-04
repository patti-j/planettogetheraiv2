import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Plus,
  Palette,
  Bot,
  Component,
  BarChart3,
  Layout,
  Settings
} from 'lucide-react';

interface MobileDesignStudioNewProps {
  onClose: () => void;
  onAiAssistant: () => void;
}

export function MobileDesignStudioNew({ onClose, onAiAssistant }: MobileDesignStudioNewProps) {
  const [activeTab, setActiveTab] = React.useState('widgets');

  // Simple template data
  const widgets = [
    { id: 1, name: 'KPI Card', description: 'Key performance indicators' },
    { id: 2, name: 'Chart Widget', description: 'Data visualization charts' },
    { id: 3, name: 'Status List', description: 'Status monitoring lists' },
    { id: 4, name: 'Gauge Widget', description: 'Circular progress gauges' },
  ];

  const dashboards = [
    { id: 1, name: 'Factory Overview', description: 'Production metrics dashboard' },
    { id: 2, name: 'Quality Control', description: 'Quality metrics and tests' },
    { id: 3, name: 'Inventory', description: 'Stock levels and tracking' },
  ];

  const pages = [
    { id: 1, name: 'Production Schedule', description: 'Manufacturing schedule management' },
    { id: 2, name: 'Resource Planning', description: 'Equipment and workforce planning' },
    { id: 3, name: 'Quality Dashboard', description: 'Quality control and testing' },
  ];

  const menuItems = [
    { id: '1', name: 'Planning & Scheduling', pages: ['Production Schedule', 'Resource Planning'] },
    { id: '2', name: 'Operations', pages: ['Manufacturing', 'Quality Control'] },
    { id: '3', name: 'Data Management', pages: ['Master Data', 'Import/Export'] },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Simple Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium">Design Studio</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* AI Button */}
      <div className="p-3 border-b">
        <Button
          onClick={onAiAssistant}
          className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white text-sm"
        >
          <Bot className="w-3 h-3 mr-2" />
          AI Assistant
        </Button>
      </div>

      {/* Complete Tab Navigation */}
      <div className="grid grid-cols-4 border-b bg-gray-50">
        <button
          onClick={() => setActiveTab('widgets')}
          className={`py-2 text-xs font-medium ${
            activeTab === 'widgets' 
              ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Component className="w-3 h-3 mx-auto mb-1" />
          Widgets
        </button>
        <button
          onClick={() => setActiveTab('dashboards')}
          className={`py-2 text-xs font-medium ${
            activeTab === 'dashboards' 
              ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-3 h-3 mx-auto mb-1" />
          Dashboards
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`py-2 text-xs font-medium ${
            activeTab === 'pages' 
              ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layout className="w-3 h-3 mx-auto mb-1" />
          Pages
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`py-2 text-xs font-medium ${
            activeTab === 'menu' 
              ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-3 h-3 mx-auto mb-1" />
          Menu
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'widgets' && (
          <div className="space-y-3">
            {widgets.map((widget) => (
              <div key={widget.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <h3 className="font-medium text-sm mb-1">{widget.name}</h3>
                <p className="text-xs text-gray-600 mb-3">{widget.description}</p>
                <Button size="sm" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Widget
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dashboards' && (
          <div className="space-y-3">
            {dashboards.map((dashboard) => (
              <div key={dashboard.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <h3 className="font-medium text-sm mb-1">{dashboard.name}</h3>
                <p className="text-xs text-gray-600 mb-3">{dashboard.description}</p>
                <Button size="sm" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Dashboard
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-3">
            {pages.map((page) => (
              <div key={page.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <h3 className="font-medium text-sm mb-1">{page.name}</h3>
                <p className="text-xs text-gray-600 mb-3">{page.description}</p>
                <Button size="sm" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Page
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-3">
            {menuItems.map((category) => (
              <div key={category.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <h3 className="font-medium text-sm mb-2">{category.name}</h3>
                <div className="space-y-1 mb-3">
                  {category.pages.map((page, idx) => (
                    <div key={idx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {page}
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full" variant="outline">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}