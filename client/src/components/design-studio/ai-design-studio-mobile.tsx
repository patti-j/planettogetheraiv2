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
  MessageSquare,
  Eye,
  Edit3
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
  const [previewItem, setPreviewItem] = React.useState<any>(null);
  const [previewType, setPreviewType] = React.useState<'widget' | 'dashboard' | null>(null);
  const [loadingWidgetId, setLoadingWidgetId] = React.useState<number | null>(null);

  // Debug effect to track state changes
  React.useEffect(() => {
    console.log('🎯 Preview state changed:', {
      previewItem: previewItem ? previewItem.title : null,
      previewType,
      shouldShowDialog: Boolean(previewItem && previewType)
    });
  }, [previewItem, previewType]);

  const handleAiPrompt = async (promptOverride?: string) => {
    const finalPrompt = promptOverride || aiPrompt;
    if (!finalPrompt.trim()) return;
    
    setIsProcessing(true);
    console.log('🤖 AI Prompt:', finalPrompt, 'Context:', activeTab);
    
    try {
      // Send the AI prompt to the backend for processing
      const response = await fetch('/api/ai/design-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          prompt: finalPrompt,
          context: activeTab,
          systemData: {
            widgets: 7, // Using static counts for now
            dashboards: 5,
            pages: 30,
            menuSections: 7
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎯 AI Response:', result);
        
        // Handle the AI response based on the action type
        if (result.success && result.data) {
          console.log('✅ AI Response:', result.data);
          
          if (result.data.action === 'create_widget') {
            console.log('🎯 Widget Creation Details:', result.data.details);
            
            if (result.data.createdWidget) {
              const widget = result.data.createdWidget;
              alert(`✅ Widget Created Successfully!\n\nTitle: ${widget.title}\nSubtitle: ${widget.subtitle}\nDescription: ${widget.description}\n\nCheck your widgets list to see it in action.`);
              // Optionally reload the widgets list
              window.location.reload();
            } else if (result.data.error) {
              alert(`❌ Widget creation failed: ${result.data.error}`);
            } else {
              alert(`Widget creation processed: ${result.data.message}`);
            }
          } else if (result.data.action === 'view_widget') {
            console.log('🎯 Viewing Widget:', result.data.currentWidget);
            const widget = result.data.currentWidget;
            if (widget) {
              const widgetInfo = `📋 Widget Details: ${widget.title}\n\n` +
                `📊 Type: ${widget.type || 'N/A'}\n` +
                `📈 Chart: ${widget.chartType || 'N/A'}\n` +
                `🗃️ Data Source: ${widget.dataSource || 'N/A'}\n` +
                `📱 Platform: ${widget.targetPlatform || 'N/A'}\n` +
                `🏷️ Category: ${widget.category || 'N/A'}\n` +
                `⏱️ Refresh: ${widget.refreshInterval || 'N/A'}s\n\n` +
                `💬 Description: ${widget.description || 'No description'}\n\n` +
                `🏷️ Tags: ${widget.tags ? widget.tags.join(', ') : 'None'}\n` +
                `🔓 Shared: ${widget.isShared ? 'Yes' : 'No'}\n\n` +
                `Created: ${widget.createdAt ? new Date(widget.createdAt).toLocaleDateString() : 'N/A'}\n\n` +
                `💡 You can now ask AI to modify this widget!`;
              alert(widgetInfo);
            }
          } else if (result.data.action === 'modify_widget') {
            console.log('🎯 Modified Widget:', result.data.modifiedWidget);
            if (result.data.error) {
              alert(`❌ Widget modification failed: ${result.data.error}`);
            } else if (result.data.modifiedWidget) {
              alert(`✅ Widget "${result.data.modifiedWidget.title}" has been successfully modified with AI improvements!`);
              // Close preview dialog if open
              if (previewItem && previewType) {
                setPreviewItem(null);
                setPreviewType(null);
              }
              // Refresh the widgets list to show updated data
              refetchWidgets();
            } else {
              alert(`Widget modification processed: ${result.data.message}`);
            }
          } else if (result.data.action === 'preview_item') {
            console.log('🎯 Preview Data:', result.data.previewData);
            const preview = result.data.previewData;
            if (preview) {
              let previewText = `📋 Preview: ${preview.title || 'Item'}\n\n`;
              if (preview.mockData) {
                previewText += `Sample Data:\n- Value: ${preview.mockData.value}\n- Trend: ${preview.mockData.trend}\n- Status: ${preview.mockData.status}`;
              } else if (preview.widgets) {
                previewText += `Dashboard Layout: ${preview.layout}\nWidgets: ${preview.widgets.map(w => w.title).join(', ')}`;
              }
              alert(previewText);
            }
          } else if (result.data.action === 'modify_dashboard') {
            console.log('🎯 Dashboard Modification Details:', result.data.details);
            alert(`Dashboard modification processed: ${result.data.message}`);
          } else if (result.data.action === 'create_page') {
            console.log('🎯 Page Creation Details:', result.data.details);
            alert(`Page creation processed: ${result.data.message}`);
          } else if (result.data.action === 'reorganize_menu') {
            console.log('🎯 Menu Reorganization Details:', result.data.details);
            alert(`Menu reorganization processed: ${result.data.message}`);
          }
          
          console.log('🎉 AI request completed successfully:', result.data.message);
        } else {
          console.log('⚠️ AI request completed but no action taken');
          alert('AI processed your request but no specific action was identified.');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ AI request failed:', response.status, errorText);
        alert(`AI request failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ AI request error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      });
      alert(`AI request error: ${error.message || 'Network error'}`);
    } finally {
      setIsProcessing(false);
      setAiPrompt('');
    }
  };

  // Fetch actual widgets from the system
  const { data: widgets = [], isLoading: widgetsLoading, refetch: refetchWidgets } = useQuery({
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
      "Create a production efficiency widget",
      "Open the Production Overview widget",
      "Show me the Resource Status Overview widget",
      "View widget details for Equipment Status"
    ],
    dashboards: [
      "Create a mobile-optimized operations dashboard",
      "Preview the Factory Overview dashboard layout",
      "Build a dashboard for quality control managers",
      "Show me how the shift handover dashboard would look"
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
              placeholder={`Ask AI to ${activeTab === 'widgets' ? 'create widgets, preview designs, or track metrics' : activeTab === 'dashboards' ? 'build dashboards, show previews, or organize layouts' : activeTab === 'pages' ? 'create pages or preview layouts' : 'reorganize menus or preview structures'}...`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAiPrompt()}
              className="flex-1"
              disabled={isProcessing}
            />
            <Button 
              size="sm" 
              onClick={() => handleAiPrompt()}
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
      <div className="flex border-b bg-gray-50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1 truncate">
              <tab.icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tab.name}</span>
              <span className="text-[10px] bg-gray-200 text-gray-700 px-1 rounded flex-shrink-0">
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
            <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-800">AI Suggestions</span>
          </div>
          <div className="space-y-1">
            {aiSuggestions[activeTab as keyof typeof aiSuggestions]?.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setAiPrompt(suggestion)}
                className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors break-words leading-relaxed"
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
                      <h3 className="font-medium text-sm">{widget.title || widget.name}</h3>
                      <div className="flex gap-1">
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {widget.widgetType || widget.type}
                        </span>
                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded">
                          {widget.dataSource || widget.source}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{widget.description || `Widget showing ${widget.dataSource || widget.source} data`}</p>
                    
                    {/* Preview Button */}
                    <div className="mt-3">
                      <button
                        onClick={async () => {
                          console.log('🔍 Preview button clicked for widget:', widget.title || widget.name);
                          setLoadingWidgetId(widget.id);
                          
                          try {
                            const response = await fetch('/api/ai/design-studio', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({
                                prompt: `Show me the details of ${widget.title || widget.name} widget`,
                                context: 'widgets'
                              })
                            });
                            
                            if (response.ok) {
                              const result = await response.json();
                              console.log('🎯 Preview response:', result);
                              if (result.success && result.data?.currentWidget) {
                                console.log('✅ Setting preview item to currentWidget:', result.data.currentWidget.title);
                                const currentWidget = result.data.currentWidget;
                                console.log('🔍 Current widget data:', currentWidget);
                                setPreviewItem(currentWidget);
                                setPreviewType('widget');
                                console.log('🔍 State set - previewItem should be:', currentWidget.title);
                              } else {
                                console.log('❌ No currentWidget in response, using fallback widget data');
                                setPreviewItem(widget);
                                setPreviewType('widget');
                              }
                            } else {
                              console.log('❌ API response not ok:', response.status);
                              setPreviewItem(widget);
                              setPreviewType('widget');
                            }
                          } catch (error) {
                            console.error('Preview error:', error);
                            console.log('❌ Exception occurred, using fallback widget data');
                            setPreviewItem(widget);
                            setPreviewType('widget');
                          } finally {
                            setLoadingWidgetId(null);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded transition-colors"
                        disabled={loadingWidgetId === widget.id}
                      >
                        <Eye className="w-3 h-3" />
                        {loadingWidgetId === widget.id ? 'Loading...' : 'Preview & Edit'}
                      </button>
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
                      <h3 className="font-medium text-sm">{dashboard.title || dashboard.name}</h3>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {dashboard.targetPlatform}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{dashboard.description}</p>
                    
                    {/* Preview Button */}
                    <div className="mt-3">
                      <button
                        onClick={async () => {
                          console.log('🔍 Preview button clicked for dashboard:', dashboard.title || dashboard.name);
                          
                          try {
                            // For dashboards, just show the basic info for now
                            setPreviewItem(dashboard);
                            setPreviewType('dashboard');
                            console.log('✅ Opening preview dialog for dashboard:', dashboard.title);
                          } catch (error) {
                            console.error('Preview error:', error);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Preview & Edit
                      </button>
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
                  <h3 className="font-medium text-sm mb-2 break-words">{section.name}</h3>
                  <div className="space-y-1">
                    {section.pages.map((pageName, index) => (
                      <div key={index} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200 break-words leading-relaxed">
                        {pageName}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-2 break-words leading-relaxed">
                    💡 Ask AI to reorganize, add pages, or create role-based menus
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      {previewItem && previewType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{previewType === 'widget' ? 'Widget' : 'Dashboard'} Preview</h2>
              <button
                onClick={() => {
                  setPreviewItem(null);
                  setPreviewType(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium text-lg">{previewItem.title}</h3>
                {previewItem.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{previewItem.subtitle}</p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                  <p className="text-sm mt-1">{previewItem.description || 'No description available'}</p>
                </div>

                {previewType === 'widget' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chart Type</label>
                        <p className="text-sm mt-1">{previewItem.chartType || previewItem.chart_type || previewItem.type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Source</label>
                        <p className="text-sm mt-1">{previewItem.dataSource || previewItem.data_source || previewItem.source || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                        <p className="text-sm mt-1">{previewItem.category || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Refresh Rate</label>
                        <p className="text-sm mt-1">{previewItem.refreshInterval || previewItem.refresh_interval || 'N/A'}s</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platform</label>
                      <p className="text-sm mt-1">{previewItem.targetPlatform || previewItem.target_platform || 'N/A'}</p>
                    </div>

                    {previewItem.tags && previewItem.tags.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {previewItem.tags.map((tag: string, index: number) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {previewType === 'dashboard' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target Platform</label>
                    <p className="text-sm mt-1">{previewItem.targetPlatform || 'N/A'}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {previewItem.createdAt ? new Date(previewItem.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* AI Edit Section */}
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  AI Modifications
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder={`Ask AI to modify this ${previewType}...`}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiPrompt()}
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleAiPrompt()}
                    disabled={!aiPrompt.trim() || isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Apply AI Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}