import React from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Plus,
  Palette,
  Bot,
  Component,
  BarChart3,
  Layout,
  Settings,
  Edit,
  Copy
} from 'lucide-react';

interface MobileDesignStudioNewProps {
  onClose: () => void;
  onAiAssistant: () => void;
}

export function MobileDesignStudioNew({ onClose, onAiAssistant }: MobileDesignStudioNewProps) {
  const [activeTab, setActiveTab] = React.useState('widgets');

  // Fetch actual widgets from the system
  const { data: widgets = [], isLoading: widgetsLoading } = useQuery({
    queryKey: ['/api/mobile/widgets'],
    select: (data) => data?.map((widget: any) => ({
      id: widget.id,
      name: widget.title,
      description: widget.description || `${widget.widget_type} widget for ${widget.data_source}`,
      type: widget.widget_type,
      source: widget.data_source
    })) || []
  });

  // Fetch actual dashboards from the system
  const { data: dashboards = [], isLoading: dashboardsLoading } = useQuery({
    queryKey: ['/api/mobile/dashboards'],
    select: (data) => data?.map((dashboard: any) => ({
      id: dashboard.id,
      name: dashboard.title,
      description: dashboard.description || 'Dashboard for monitoring and analytics',
      targetPlatform: dashboard.targetPlatform
    })) || []
  });

  // Available page templates - these would eventually come from the system
  const pages = [
    { id: 1, name: 'Production Schedule', description: 'Manufacturing schedule management', route: '/production-schedule' },
    { id: 2, name: 'Dashboard', description: 'Analytics and metrics dashboard', route: '/dashboard' },
    { id: 3, name: 'Quality Control', description: 'Quality management and testing', route: '/quality' },
    { id: 4, name: 'Inventory Management', description: 'Stock and material tracking', route: '/inventory' },
    { id: 5, name: 'Resource Planning', description: 'Equipment and workforce planning', route: '/resources' },
    { id: 6, name: 'Operations Monitor', description: 'Real-time operations monitoring', route: '/operations' },
  ];

  // Menu structure - this would eventually come from user configuration
  const menuItems = [
    { 
      id: '1', 
      name: 'Planning & Scheduling', 
      pages: ['Production Schedule', 'Resource Planning', 'Capacity Planning'] 
    },
    { 
      id: '2', 
      name: 'Operations', 
      pages: ['Manufacturing Execution', 'Quality Control', 'Equipment Monitor'] 
    },
    { 
      id: '3', 
      name: 'Data Management', 
      pages: ['Master Data', 'Import/Export', 'Data Analytics'] 
    },
    { 
      id: '4', 
      name: 'Administration', 
      pages: ['User Management', 'System Settings', 'Reports'] 
    },
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
            {widgetsLoading ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading widgets...</div>
            ) : widgets.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Component className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No widgets found</p>
                <Button size="sm" className="mt-2">
                  <Plus className="w-3 h-3 mr-1" />
                  Create First Widget
                </Button>
              </div>
            ) : (
              widgets.map((widget) => (
                <div key={widget.id} className="border rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm">{widget.name}</h3>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="w-3 h-3 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{widget.description}</p>
                  <div className="flex gap-1 mb-3">
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {widget.type}
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded">
                      {widget.source}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Copy className="w-3 h-3 mr-1" />
                      Clone
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {/* Create New Widget Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Component className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium mb-1">Create New Widget</p>
              <p className="text-xs text-gray-500 mb-3">Build custom widgets for your dashboards</p>
              <Button size="sm" className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Widget Designer
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'dashboards' && (
          <div className="space-y-3">
            {dashboardsLoading ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading dashboards...</div>
            ) : dashboards.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No dashboards found</p>
                <Button size="sm" className="mt-2">
                  <Plus className="w-3 h-3 mr-1" />
                  Create First Dashboard
                </Button>
              </div>
            ) : (
              dashboards.map((dashboard) => (
                <div key={dashboard.id} className="border rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm">{dashboard.name}</h3>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="w-3 h-3 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{dashboard.description}</p>
                  <div className="flex gap-1 mb-3">
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {dashboard.targetPlatform}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Copy className="w-3 h-3 mr-1" />
                      Clone
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {/* Create New Dashboard Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium mb-1">Create New Dashboard</p>
              <p className="text-xs text-gray-500 mb-3">Design custom dashboards with widgets</p>
              <Button size="sm" className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Dashboard Designer
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-3">
            {pages.map((page) => (
              <div key={page.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-sm">{page.name}</h3>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-3 h-3 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{page.description}</p>
                <div className="flex gap-1 mb-3">
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    {page.route}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Layout
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Copy className="w-3 h-3 mr-1" />
                    Clone Page
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Create New Page Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Layout className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium mb-1">Create New Page</p>
              <p className="text-xs text-gray-500 mb-3">Design custom pages with layouts and widgets</p>
              <Button size="sm" className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Page Designer
              </Button>
            </div>
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