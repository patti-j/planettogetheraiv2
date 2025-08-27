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
  Edit3,
  Trash2
} from 'lucide-react';

interface AiDesignStudioMobileProps {
  onClose?: () => void;
  onAiAssistant?: () => void;
  previewItem?: any;
  previewType?: 'widget' | 'dashboard' | 'page' | null;
  onClosePreview?: () => void;
  showDesignStudio?: boolean; // Control whether to show the full design studio interface
}

export function AiDesignStudioMobile({ 
  onClose, 
  onAiAssistant,
  previewItem: externalPreviewItem,
  previewType: externalPreviewType,
  onClosePreview,
  showDesignStudio = false
}: AiDesignStudioMobileProps) {
  const [activeTab, setActiveTab] = React.useState('widgets');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState<any>(null);
  const [previewType, setPreviewType] = React.useState<'widget' | 'dashboard' | 'page' | null>(null);
  
  // Use external preview props if provided, otherwise use internal state
  const activePreviewItem = externalPreviewItem || previewItem;
  const activePreviewType = externalPreviewType || previewType;
  const [loadingWidgetId, setLoadingWidgetId] = React.useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    item: any;
    type: 'widget' | 'dashboard' | 'page';
    isOpen: boolean;
  }>({ item: null, type: 'widget', isOpen: false });

  // Debug effect to track state changes
  React.useEffect(() => {
    console.log('🎯 Preview state changed:', {
      previewItem: previewItem ? previewItem.title : null,
      previewType,
      shouldShowDialog: Boolean(previewItem && previewType)
    });
    
    // Additional check for DOM rendering
    if (previewItem && previewType) {
      setTimeout(() => {
        const dialog = document.querySelector('[data-preview-dialog]');
        console.log('🔍 Dialog element found in DOM:', !!dialog);
        if (dialog) {
          console.log('🔍 Dialog computed styles:', {
            display: window.getComputedStyle(dialog).display,
            zIndex: window.getComputedStyle(dialog).zIndex,
            position: window.getComputedStyle(dialog).position
          });
        }
      }, 100);
    }
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
              console.log('✅ Setting preview item to newly created widget:', widget.title);
              
              // Show the preview window for the newly created widget
              setPreviewItem(widget);
              setPreviewType('widget');
              
              // Refresh the widgets list to show the new widget
              refetchWidgets();
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
          } else if (result.data.action === 'delete_widget') {
            console.log('🗑️ Widget Deletion:', result.data.deletedWidget);
            if (result.data.error) {
              alert(`❌ Widget deletion failed: ${result.data.error}`);
            } else if (result.data.deletedWidget) {
              alert(`✅ Widget "${result.data.deletedWidget.title}" has been successfully deleted!`);
              refetchWidgets();
            } else {
              alert(`Widget deletion processed: ${result.data.message}`);
            }
          } else if (result.data.action === 'delete_dashboard') {
            console.log('🗑️ Dashboard Deletion:', result.data.deletedDashboard);
            if (result.data.error) {
              alert(`❌ Dashboard deletion failed: ${result.data.error}`);
            } else if (result.data.deletedDashboard) {
              alert(`✅ Dashboard "${result.data.deletedDashboard.title}" has been successfully deleted!`);
              refetchDashboards();
            } else {
              alert(`Dashboard deletion processed: ${result.data.message}`);
            }
          } else if (result.data.action === 'delete_page') {
            console.log('🗑️ Page Deletion:', result.data.deletedPage);
            if (result.data.error) {
              alert(`❌ Page deletion failed: ${result.data.error}`);
            } else if (result.data.deletedPage) {
              alert(`✅ Page "${result.data.deletedPage.name}" deletion request processed!\n\n${result.data.message}`);
            } else {
              alert(`Page deletion processed: ${result.data.message}`);
            }
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
  const { data: dashboards = [], isLoading: dashboardsLoading, refetch: refetchDashboards } = useQuery({
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

  // If no preview and design studio not explicitly enabled, don't render anything
  if (!activePreviewItem && !showDesignStudio) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-50 to-blue-50 p-3 flex-shrink-0">
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
            <Sparkles className="w-4 h-4 text-purple-600" />
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
      <div className="flex border-b bg-gray-50 overflow-x-auto flex-shrink-0">
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
                    
                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
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
                        className="flex-1 flex items-center justify-center gap-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded transition-colors"
                        disabled={loadingWidgetId === widget.id}
                      >
                        <Eye className="w-3 h-3" />
                        {loadingWidgetId === widget.id ? 'Loading...' : 'Preview'}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmation({
                            item: widget,
                            type: 'widget',
                            isOpen: true
                          });
                        }}
                        className="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
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
                    
                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
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
                        className="flex-1 flex items-center justify-center gap-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmation({
                            item: dashboard,
                            type: 'dashboard',
                            isOpen: true
                          });
                        }}
                        className="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
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
                  
                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        console.log('🔍 Preview button clicked for page:', page.name);
                        setPreviewItem(page);
                        setPreviewType('page');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmation({
                          item: page,
                          type: 'page',
                          isOpen: true
                        });
                      }}
                      className="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
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
      {activePreviewItem && activePreviewType && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 99999
          }}
          onClick={(e) => {
            // Close dialog if clicking the backdrop
            if (e.target === e.currentTarget) {
              if (onClosePreview) {
                onClosePreview();
              } else {
                setPreviewItem(null);
                setPreviewType(null);
              }
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
            data-preview-dialog="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{activePreviewType === 'widget' ? 'Widget' : activePreviewType === 'dashboard' ? 'Dashboard' : 'Page'} Preview</h2>
              <button
                onClick={() => {
                  if (onClosePreview) {
                    onClosePreview();
                  } else {
                    setPreviewItem(null);
                    setPreviewType(null);
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Edit Section - Moved to top for mobile keyboard */}
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
              <label className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-2 block">
                ✨ AI Modifications
              </label>
              <div className="space-y-2">
                <Input
                  placeholder={`Ask AI to modify this ${activePreviewType}...`}
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

            {/* Live Preview */}
            <div className="p-4 bg-gray-50 border-b">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2 block">
                🔍 Live Preview
              </label>
              <div className="bg-white rounded-lg border p-3 shadow-sm">
                {activePreviewType === 'widget' && (
                  <div className="space-y-2">
                    {/* Widget Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{activePreviewItem.title}</h4>
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    </div>
                    
                    {/* Chart Visualization */}
                    <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded flex items-center justify-center">
                      {(() => {
                        const chartType = activePreviewItem.chartType || activePreviewItem.chart_type || activePreviewItem.type || 'chart';
                        
                        if (chartType.toLowerCase().includes('gauge') || chartType.toLowerCase().includes('status')) {
                          return (
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full border-4 border-green-300 border-t-green-600 flex items-center justify-center">
                                <span className="text-xs font-bold text-green-700">85%</span>
                              </div>
                              <div className="text-xs">
                                <div className="text-green-600 font-medium">Operational</div>
                                <div className="text-gray-500">12/15 Equipment</div>
                              </div>
                            </div>
                          );
                        } else if (chartType.toLowerCase().includes('bar') || chartType.toLowerCase().includes('chart')) {
                          return (
                            <div className="flex items-end space-x-1 h-16">
                              <div className="w-3 bg-blue-400 h-8 rounded-t"></div>
                              <div className="w-3 bg-green-400 h-12 rounded-t"></div>
                              <div className="w-3 bg-yellow-400 h-6 rounded-t"></div>
                              <div className="w-3 bg-red-400 h-10 rounded-t"></div>
                              <div className="w-3 bg-purple-400 h-14 rounded-t"></div>
                            </div>
                          );
                        } else if (chartType.toLowerCase().includes('kpi') || chartType.toLowerCase().includes('metric')) {
                          return (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">247</div>
                              <div className="text-xs text-gray-500">Active Orders</div>
                              <div className="text-xs text-green-500 mt-1">↗ +12% from yesterday</div>
                            </div>
                          );
                        } else if (chartType.toLowerCase().includes('list')) {
                          return (
                            <div className="w-full space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Reactor A-01</span>
                                <span className="text-green-600">Running</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Mixer B-03</span>
                                <span className="text-yellow-600">Idle</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Press C-12</span>
                                <span className="text-red-600">Maintenance</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded"></div>
                              <div className="text-xs text-gray-600">Live Data</div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    
                    {/* Widget Footer */}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Updated: 2m ago</span>
                      <span>📊 {activePreviewItem.dataSource || activePreviewItem.data_source || 'data'}</span>
                    </div>
                  </div>
                )}
                
                {activePreviewType === 'dashboard' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{activePreviewItem.title}</h4>
                      <div className="text-xs text-gray-500">Dashboard View</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 h-20">
                      <div className="bg-blue-100 rounded p-2 flex items-center justify-center">
                        <div className="text-xs text-center">
                          <div className="font-bold">Widget 1</div>
                          <div className="text-gray-600">Chart</div>
                        </div>
                      </div>
                      <div className="bg-green-100 rounded p-2 flex items-center justify-center">
                        <div className="text-xs text-center">
                          <div className="font-bold">Widget 2</div>
                          <div className="text-gray-600">Metrics</div>
                        </div>
                      </div>
                      <div className="bg-yellow-100 rounded p-2 flex items-center justify-center">
                        <div className="text-xs text-center">
                          <div className="font-bold">Widget 3</div>
                          <div className="text-gray-600">Status</div>
                        </div>
                      </div>
                      <div className="bg-purple-100 rounded p-2 flex items-center justify-center">
                        <div className="text-xs text-center">
                          <div className="font-bold">Widget 4</div>
                          <div className="text-gray-600">List</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewType === 'page' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{activePreviewItem.name}</h4>
                      <div className="text-xs text-gray-500">Page Layout</div>
                    </div>
                    <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded"></div>
                        <div className="text-xs text-gray-600">{activePreviewItem.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{activePreviewItem.route}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium text-lg">{activePreviewItem.title || activePreviewItem.name}</h3>
                {activePreviewItem.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{activePreviewItem.subtitle}</p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                  <p className="text-sm mt-1">{activePreviewItem.description || 'No description available'}</p>
                </div>

                {activePreviewType === 'widget' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chart Type</label>
                        <p className="text-sm mt-1">{activePreviewItem.chartType || activePreviewItem.chart_type || activePreviewItem.type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Source</label>
                        <p className="text-sm mt-1">{activePreviewItem.dataSource || activePreviewItem.data_source || activePreviewItem.source || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                        <p className="text-sm mt-1">{activePreviewItem.category || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Refresh Rate</label>
                        <p className="text-sm mt-1">{activePreviewItem.refreshInterval || activePreviewItem.refresh_interval || 'N/A'}s</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platform</label>
                      <div className="text-sm mt-1">
                        {(() => {
                          const platform = activePreviewItem.targetPlatform || activePreviewItem.target_platform || 'N/A';
                          if (platform === 'both') {
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                  📱 Mobile
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                                  🖥️ Desktop
                                </span>
                              </div>
                            );
                          } else if (platform === 'mobile') {
                            return (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                📱 Mobile
                              </span>
                            );
                          } else if (platform === 'desktop') {
                            return (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                                🖥️ Desktop
                              </span>
                            );
                          } else {
                            return <span>{platform}</span>;
                          }
                        })()}
                      </div>
                    </div>

                    {activePreviewItem.tags && activePreviewItem.tags.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activePreviewItem.tags.map((tag: string, index: number) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activePreviewType === 'dashboard' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target Platform</label>
                    <div className="text-sm mt-1">
                      {(() => {
                        const platform = activePreviewItem.targetPlatform || 'N/A';
                        if (platform === 'both') {
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                📱 Mobile
                              </span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                                🖥️ Desktop
                              </span>
                            </div>
                          );
                        } else if (platform === 'mobile') {
                          return (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                              📱 Mobile
                            </span>
                          );
                        } else if (platform === 'desktop') {
                          return (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                              🖥️ Desktop
                            </span>
                          );
                        } else {
                          return <span>{platform}</span>;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {activePreviewType === 'page' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Route</label>
                      <p className="text-sm mt-1">{activePreviewItem.route || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                      <p className="text-sm mt-1">System Page</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {activePreviewType === 'page' ? 'System Default' : 
                           (activePreviewItem.createdAt ? new Date(activePreviewItem.createdAt).toLocaleDateString() : 'N/A')}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirmation({ item: null, type: 'widget', isOpen: false });
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  Delete {deleteConfirmation.type}
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {deleteConfirmation.type === 'page' ? (
                <>
                  Are you sure you want to request deletion of "{deleteConfirmation.item?.name}"? 
                  This will log a request to remove the page from the system.
                </>
              ) : (
                <>
                  Are you sure you want to delete "{deleteConfirmation.item?.title || deleteConfirmation.item?.name}"? 
                  This will permanently remove the {deleteConfirmation.type} and all its data.
                </>
              )}
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirmation({ item: null, type: 'widget', isOpen: false })}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  setIsProcessing(true);
                  const prompt = `Delete ${deleteConfirmation.type} "${deleteConfirmation.item?.title || deleteConfirmation.item?.name}"`;
                  
                  try {
                    const response = await fetch('/api/ai/design-studio', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        prompt,
                        context: deleteConfirmation.type === 'widget' ? 'widgets' : 
                                deleteConfirmation.type === 'dashboard' ? 'dashboards' : 'pages',
                        systemData: {
                          widgets: widgets.length,
                          dashboards: dashboards.length,
                          pages: 30,
                          menuSections: 7
                        }
                      })
                    });
                    
                    const result = await response.json();
                    console.log('🗑️ Delete Result:', result);
                    
                    if (result.success) {
                      // Refresh data after deletion
                      await Promise.all([
                        refetchWidgets(),
                        refetchDashboards()
                      ]);
                      
                      setDeleteConfirmation({ item: null, type: 'widget', isOpen: false });
                      
                      // Close preview if the deleted item was being previewed
                      if (previewItem && previewItem.id === deleteConfirmation.item?.id) {
                        setPreviewItem(null);
                        setPreviewType(null);
                      }
                    }
                  } catch (error) {
                    console.error('Delete request failed:', error);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}