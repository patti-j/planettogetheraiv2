import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Component,
  BarChart3,
  Layout,
  Settings,
  Send,
  Sparkles,
  Bot,
  Zap,
  MessageSquare
} from 'lucide-react';

interface AiDesignStudioMobileProps {
  onClose: () => void;
  onAiAssistant: () => void;
}

export function AiDesignStudioMobile({ 
  onClose, 
  onAiAssistant
}: AiDesignStudioMobileProps) {
  const [activeTab, setActiveTab] = React.useState('widgets');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsProcessing(true);
    console.log('🤖 AI Prompt:', aiPrompt);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setAiPrompt('');
    }, 2000);
  };

  // Fetch actual widgets from the system
  const { data: widgets = [], isLoading: widgetsLoading } = useQuery({
    queryKey: ['/api/mobile/widgets'],
    select: (data: any) => data?.map((widget: any) => ({
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
    select: (data: any) => data?.map((dashboard: any) => ({
      id: dashboard.id,
      name: dashboard.title,
      description: dashboard.description || 'Dashboard for monitoring and analytics',
      targetPlatform: dashboard.targetPlatform
    })) || []
  });

  // Available page templates
  const pages = [
    { id: 1, name: 'Production Schedule', description: 'Manufacturing schedule management', route: '/production-schedule' },
    { id: 2, name: 'Dashboard', description: 'Analytics and metrics dashboard', route: '/dashboard' },
    { id: 3, name: 'Quality Control', description: 'Quality management and testing', route: '/quality' },
    { id: 4, name: 'Inventory Management', description: 'Stock and material tracking', route: '/inventory' },
    { id: 5, name: 'Resource Planning', description: 'Equipment and workforce planning', route: '/resources' },
    { id: 6, name: 'Operations Monitor', description: 'Real-time operations monitoring', route: '/operations' },
  ];

  // Menu structure
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

  const tabs = [
    { id: 'widgets', name: 'Widgets', icon: Component, count: widgets.length },
    { id: 'dashboards', name: 'Dashboards', icon: BarChart3, count: dashboards.length },
    { id: 'pages', name: 'Pages', icon: Layout, count: pages.length },
    { id: 'menu', name: 'Menu', icon: Settings, count: menuItems.length },
  ];

  const aiSuggestions = {
    widgets: [
      "Create a new production KPI widget",
      "Clone the Equipment Status widget with different metrics",
      "Modify the Quality Metrics widget to show trends",
      "Delete the outdated Inventory Levels widget"
    ],
    dashboards: [
      "Create a mobile-optimized operations dashboard",
      "Clone Factory Overview for night shift",
      "Add real-time alerts to Production Planning",
      "Reorganize Quality Control layout"
    ],
    pages: [
      "Create a new batch tracking page",
      "Modify the inventory page for mobile",
      "Add barcode scanning to quality control",
      "Create a maintenance scheduling page"
    ],
    menu: [
      "Reorganize menu for better workflow",
      "Add quick actions to Planning section",
      "Create role-based menu variations",
      "Simplify navigation for operators"
    ]
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-50 to-blue-50 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">AI Design Studio</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Prompt Interface */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">AI Assistant</span>
            <Zap className="w-3 h-3 text-yellow-500" />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Tell me what you want to create, modify, or delete..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAiPrompt()}
              className="flex-1"
              disabled={isProcessing}
            />
            <Button 
              size="sm" 
              onClick={handleAiPrompt}
              disabled={!aiPrompt.trim() || isProcessing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <tab.icon className="w-3 h-3" />
              <span>{tab.name}</span>
              <span className="text-[10px] bg-gray-200 text-gray-700 px-1 rounded">
                {tab.count}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Suggestions Panel */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">AI Suggestions</span>
          </div>
          <div className="space-y-1">
            {aiSuggestions[activeTab as keyof typeof aiSuggestions]?.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setAiPrompt(suggestion)}
                className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Content Display */}
        <div className="p-3 space-y-3">
          {activeTab === 'widgets' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Current Widgets ({widgets.length})</h3>
              </div>
              {widgetsLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading widgets...</div>
              ) : widgets.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Component className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No widgets found</p>
                  <p className="text-xs text-purple-600 mt-2">Ask AI to create your first widget!</p>
                </div>
              ) : (
                widgets.map((widget: any) => (
                  <div key={widget.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm">{widget.name}</h3>
                      <div className="flex gap-1">
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {widget.type}
                        </span>
                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded">
                          {widget.source}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{widget.description}</p>
                    <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      💡 Ask AI to modify, clone, or delete this widget
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'dashboards' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Current Dashboards ({dashboards.length})</h3>
              </div>
              {dashboardsLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading dashboards...</div>
              ) : dashboards.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No dashboards found</p>
                  <p className="text-xs text-purple-600 mt-2">Ask AI to create your first dashboard!</p>
                </div>
              ) : (
                dashboards.map((dashboard: any) => (
                  <div key={dashboard.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm">{dashboard.name}</h3>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {dashboard.targetPlatform}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{dashboard.description}</p>
                    <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      💡 Ask AI to modify, clone, or delete this dashboard
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'pages' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">System Pages ({pages.length})</h3>
              </div>
              {pages.map((page) => (
                <div key={page.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm">{page.name}</h3>
                    <span className="text-[10px] bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {page.route}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{page.description}</p>
                  <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    💡 Ask AI to create variations, modify layout, or add features
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Menu Structure ({menuItems.length} sections)</h3>
              </div>
              {menuItems.map((section) => (
                <div key={section.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-sm mb-2">{section.name}</h3>
                  <div className="space-y-1">
                    {section.pages.map((pageName, index) => (
                      <div key={index} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                        {pageName}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-2">
                    💡 Ask AI to reorganize, add pages, or create role-based menus
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}