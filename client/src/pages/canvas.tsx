import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Download, 
  Share2, 
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Trash2,
  Copy,
  FileImage,
  RefreshCw
} from 'lucide-react';
import { useAITheme } from '@/hooks/use-ai-theme';
import { toast } from '@/hooks/use-toast';

interface CanvasItem {
  id: string;
  type: 'dashboard' | 'chart' | 'table' | 'image' | 'interactive' | 'custom';
  title: string;
  content: any;
  width?: string;
  height?: string;
  position?: { x: number; y: number };
}

interface CanvasWidget {
  id: number;
  title: string;
  widgetType: string;
  widgetSubtype: string;
  data: any;
  configuration: any;
  position: { x: number; y: number } | null;
  isVisible: boolean;
  createdByMax: boolean;
}

export default function CanvasPage() {
  const { aiTheme } = useAITheme();
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Fetch canvas widgets from API (created by Max AI)
  const { data: canvasWidgets, isLoading, refetch: refetchWidgets } = useQuery({
    queryKey: ['/api/canvas/widgets'],
    queryFn: async () => {
      const response = await fetch('/api/canvas/widgets');
      if (!response.ok) {
        throw new Error('Failed to fetch canvas widgets');
      }
      return response.json();
    },
    staleTime: 1000, // Consider data fresh for 1 second
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: false, // Disable automatic polling - use manual refetch instead
    refetchIntervalInBackground: false
  });

  // Load canvas items from localStorage on mount (legacy items)
  useEffect(() => {
    const savedItems = localStorage.getItem('max-canvas-items');
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Failed to load canvas items:', error);
      }
    }
  }, []);

  // Save canvas items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('max-canvas-items', JSON.stringify(items));
  }, [items]);

  // Auto-scroll to newly created widget from Max AI
  useEffect(() => {
    const scrollToWidgetId = sessionStorage.getItem('scrollToWidget');
    
    if (scrollToWidgetId && !isLoading && canvasWidgets) {
      // Wait for widgets to render
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-widget-id="api-${scrollToWidgetId}"]`);
        
        if (targetElement) {
          console.log('📍 Scrolling to widget:', scrollToWidgetId);
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Highlight the widget briefly
          targetElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            targetElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
          }, 2000);
        } else {
          console.log('⚠️ Widget element not found, scrolling to bottom');
          // Fallback: scroll to bottom where new widgets appear
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
        
        // Clear the flag
        sessionStorage.removeItem('scrollToWidget');
      }, 500);
    }
  }, [canvasWidgets, isLoading]);

  // Convert API widgets to canvas items format
  const convertWidgetToCanvasItem = (widget: CanvasWidget): CanvasItem => {
    // Map database widget types to canvas component types
    const getCanvasType = (widgetType: string): CanvasItem['type'] => {
      switch (widgetType.toLowerCase()) {
        case 'bar':
        case 'gauge':
        case 'pie':
        case 'line':
        case 'histogram':
          return 'chart';
        case 'table':
        case 'grid':
          return 'table';
        case 'dashboard':
        case 'kpi':
          return 'dashboard';
        case 'interactive':
          return 'interactive';
        default:
          return 'chart'; // Default to chart for most manufacturing widgets
      }
    };

    return {
      id: widget.id.toString(),
      type: getCanvasType(widget.widgetType),
      title: widget.title,
      content: widget.data, // ✅ FIXED: Pass array data directly, not spread into object
      configuration: widget.configuration, // Keep configuration separate
      width: widget.configuration?.size === 'large' ? '600px' : widget.configuration?.size === 'small' ? '300px' : '400px',
      height: '300px',
      position: widget.position
    };
  };

  // Debug API data loading
  console.log('🔍 Canvas Debug - API Loading:', isLoading);
  console.log('🔍 Canvas Debug - Raw canvasWidgets:', canvasWidgets);
  console.log('🔍 Canvas Debug - localStorage items:', items);
  
  // Filter and convert API widgets
  const apiWidgets = canvasWidgets?.filter((w: CanvasWidget) => w.isVisible) || [];
  console.log('🔍 Canvas Debug - Visible API widgets:', apiWidgets);
  
  const convertedApiWidgets = apiWidgets.map(widget => {
    const canvasItem = convertWidgetToCanvasItem(widget);
    return { ...canvasItem, id: `api-${canvasItem.id}` }; // Prefix API widgets
  });
  console.log('🔍 Canvas Debug - Converted API widgets:', convertedApiWidgets);

  // Combine localStorage items with API widgets (with unique IDs to prevent React key conflicts)
  const allItems = [
    ...items.map(item => ({ ...item, id: `local-${item.id}` })), // Prefix localStorage items
    ...convertedApiWidgets
  ];
  
  console.log('🔍 Canvas Debug - Final allItems array:', allItems);
  console.log('🔍 Canvas Debug - allItems.length:', allItems.length);

  const renderCanvasItem = (item: CanvasItem) => {
    switch (item.type) {
      case 'dashboard':
        return <DashboardWidget data={item.content} />;
      case 'chart':
        return <ChartWidget data={item.content} configuration={item.configuration} title={item.title} />;
      case 'table':
        return <TableWidget data={item.content} />;
      case 'interactive':
        return <InteractiveWidget data={item.content} />;
      case 'custom':
        return <CustomWidget data={item.content} />;
      default:
        return <div className="p-4 text-gray-500">Unknown content type</div>;
    }
  };

  const handleClearCanvas = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearCanvas = async () => {
    try {
      // Clear local items first
      setItems([]);
      localStorage.removeItem('max-canvas-items');
      
      // Clear database widgets by making them invisible
      if (canvasWidgets && canvasWidgets.length > 0) {
        await Promise.all(
          canvasWidgets.map(async (widget: CanvasWidget) => {
            try {
              await fetch(`/api/canvas/widgets/${widget.id}/visibility`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({ visible: false }),
              });
            } catch (error) {
              console.log(`Failed to hide widget ${widget.id}:`, error);
            }
          })
        );
      }
      
      setShowClearConfirmation(false);
      
      // Force immediate refetch of the canvas widgets to update the display
      await refetchWidgets();
      
      // Also invalidate the cache for good measure
      await queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
      
      toast({
        title: "Canvas Cleared",
        description: "All canvas content has been removed"
      });
    } catch (error) {
      console.error('Failed to clear canvas:', error);
      toast({
        title: "Clear Failed",
        description: "Unable to clear all canvas content",
        variant: "destructive"
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const canvasText = allItems
        .map(item => `${item.title}: ${JSON.stringify(item.content, null, 2)}`)
        .join('\n\n---\n\n');
      
      await navigator.clipboard.writeText(canvasText);
      toast({
        title: "Copied to Clipboard",
        description: "Canvas content copied successfully"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleExportJSON = () => {
    try {
      const canvasData = {
        timestamp: new Date().toISOString(),
        items: allItems,
        metadata: {
          version: "1.0",
          itemCount: allItems.length
        }
      };
      const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `max-canvas-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "JSON Exported",
        description: "Canvas data exported as JSON file"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export as JSON",
        variant: "destructive"
      });
    }
  };

  const handleExportImage = async () => {
    // This would require html2canvas or similar library in a real implementation
    toast({
      title: "Feature Coming Soon",
      description: "Image export functionality will be available soon",
      variant: "default"
    });
  };

  const handleShare = async () => {
    try {
      const shareText = `Agent Canvas Content (${allItems.length} items)\n\n${allItems
        .map(item => `${item.title}: ${JSON.stringify(item.content)}`)
        .join('\n\n---\n\n')}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Agent Canvas Content',
            text: shareText
          });
          
          toast({
            title: "Canvas Shared",
            description: "Canvas content shared successfully"
          });
          return;
        } catch (shareError) {
          console.log('Web Share API failed, falling back to clipboard');
        }
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied for Sharing",
        description: "Canvas content copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to share canvas content",
        variant: "destructive"
      });
    }
  };



  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Canvas Header */}
      <div className={`${aiTheme.gradient} text-white p-3 sm:p-6 space-y-4 sm:space-y-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:ml-0 ml-12">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Agent Canvas</h1>
              <p className="text-white/80 text-sm md:text-base">Dynamic content space for AI-generated visualizations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchWidgets()}
              className="text-white hover:bg-white/20 p-2"
              title="Refresh Canvas"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {allItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-2"
                    title="Canvas Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportImage}>
                    <FileImage className="w-4 h-4 mr-2" />
                    Export as Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Canvas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearCanvas} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Canvas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {allItems.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Canvas is empty</h3>
              <p className="text-gray-600 mb-4">Ask Max to create something for you!</p>
              <div className="text-sm text-gray-500">
                Try: "Create a dashboard" or "Show me a chart of production metrics"
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading canvas content...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 auto-fit-minmax-400">
            {allItems.map((item) => (
              <Card key={item.id} className="shadow-sm" data-widget-id={item.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderCanvasItem(item)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Canvas</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all canvas content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearCanvas}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sample widget components
const DashboardWidget: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Active Jobs</p>
              <p className="text-2xl font-bold text-blue-900">{data?.activeJobs || 12}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Efficiency</p>
              <p className="text-2xl font-bold text-green-900">{data?.efficiency || 94}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{data?.pending || 8}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Issues</p>
              <p className="text-2xl font-bold text-red-900">{data?.issues || 2}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Production Progress</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Widget Assembly</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Quality Control</span>
                <span>60%</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Packaging</span>
                <span>90%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Recent Activities</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Job #1234 completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>Machine M-002 maintenance due</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Quality check passed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartWidget: React.FC<{ data: any; configuration?: any; title?: string }> = ({ data, configuration, title }) => {
  // Use actual data from API if available, otherwise fallback to sample data
  const getChartData = () => {
    // Check if data is directly an array (real manufacturing data)
    if (Array.isArray(data) && data.length > 0) {
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0', '#a4de6c', '#8dd1e1', '#d084d0', '#ffb347'];
      return data.map((item, index) => ({
        name: item.name || `Item ${index + 1}`,
        value: Number(item.value) || 0,
        color: item.color || colors[index % colors.length],
        priority: item.priority
      }));
    }

    // Fallback to sample data only if no real data available
    const generateSampleData = () => {
      if (configuration?.chartType === 'pie') {
        return [
          { name: 'Production', value: 40, color: '#8884d8' },
          { name: 'Quality', value: 30, color: '#82ca9d' },
          { name: 'Maintenance', value: 20, color: '#ffc658' },
          { name: 'Other', value: 10, color: '#ff7300' }
        ];
      } else {
        return [
          { name: 'Production', value: 40 },
          { name: 'Quality', value: 30 },
          { name: 'Maintenance', value: 20 },
          { name: 'Other', value: 10 }
        ];
      }
    };

    return generateSampleData();
  };

  const chartData = getChartData();
  const isEmptyData = !chartData || chartData.length === 0;

  if (configuration?.chartType === 'pie') {
    return (
      <div className="h-64 bg-white rounded-lg border p-4">
        <h4 className="font-medium mb-4">{title || 'Production Chart'}</h4>
        {isEmptyData ? (
          <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No data available</p>
            </div>
          </div>
        ) : (
          <div className="h-48 relative">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {chartData.map((entry, index) => {
                const total = chartData.reduce((sum, item) => sum + item.value, 0);
                const percentage = (entry.value / total) * 100;
                const angle = (entry.value / total) * 360;
                const prevAngles = chartData.slice(0, index).reduce((sum, item) => sum + (item.value / total) * 360, 0);
                const startAngle = prevAngles - 90;
                const endAngle = startAngle + angle;
                
                const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                
                return (
                  <path
                    key={entry.name}
                    d={pathData}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                {chartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Line chart
  if (configuration?.chartType === 'line') {
    return (
      <div className="h-64 bg-white rounded-lg border p-4">
        <h4 className="font-medium mb-4">{title || 'Production Chart'}</h4>
        {isEmptyData ? (
          <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No data available</p>
            </div>
          </div>
        ) : (
          <div className="h-48 p-4 bg-gray-50 rounded relative">
            <svg viewBox="0 0 300 150" className="w-full h-full">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="30" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 15" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Chart line */}
              {chartData.length > 1 && (
                <path
                  d={chartData.map((entry, index) => {
                    const maxValue = Math.max(...chartData.map(d => d.value));
                    const x = (index / (chartData.length - 1)) * 260 + 20;
                    const y = 130 - (entry.value / maxValue) * 110;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#8884d8"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              
              {/* Data points */}
              {chartData.map((entry, index) => {
                const maxValue = Math.max(...chartData.map(d => d.value));
                const x = (index / (chartData.length - 1)) * 260 + 20;
                const y = 130 - (entry.value / maxValue) * 110;
                
                return (
                  <g key={entry.name}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#8884d8"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-xs font-medium"
                      fill="#374151"
                    >
                      {entry.value}
                    </text>
                  </g>
                );
              })}
              
              {/* X-axis labels */}
              {chartData.map((entry, index) => {
                const x = (index / (chartData.length - 1)) * 260 + 20;
                return (
                  <text
                    key={entry.name}
                    x={x}
                    y={145}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#6b7280"
                  >
                    {entry.name.length > 8 ? entry.name.slice(0, 8) + '...' : entry.name}
                  </text>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Bar chart
  return (
    <div className="h-64 bg-white rounded-lg border p-4">
      <h4 className="font-medium mb-4">{data?.title || 'Production Chart'}</h4>
      {isEmptyData ? (
        <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No data available</p>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-end justify-between gap-2 p-2 bg-gray-50 rounded">
          {chartData.map((entry, index) => {
            const maxValue = Math.max(...chartData.map(d => d.value));
            const height = (entry.value / maxValue) * 100;
            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0'];
            
            return (
              <div key={entry.name} className="flex flex-col items-center flex-1">
                <div className="text-xs font-medium mb-1">{entry.value}</div>
                <div 
                  className="w-full rounded-t"
                  style={{ 
                    height: `${height}%`, 
                    backgroundColor: colors[index % colors.length],
                    minHeight: '20px'
                  }}
                ></div>
                <div className="text-xs mt-1 text-center break-words">{entry.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TableWidget: React.FC<{ data: any }> = ({ data }) => {
  const sampleData = data?.rows || [
    { id: 1, name: 'Job #1234', status: 'In Progress', progress: 75 },
    { id: 2, name: 'Job #1235', status: 'Completed', progress: 100 },
    { id: 3, name: 'Job #1236', status: 'Pending', progress: 0 },
  ];

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h4 className="font-medium">{data?.title || 'Data Table'}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sampleData.map((row: any) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
                <td className="px-4 py-2">
                  <Badge variant={row.status === 'Completed' ? 'default' : row.status === 'In Progress' ? 'secondary' : 'outline'}>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Progress value={row.progress} className="w-16 h-2" />
                    <span className="text-sm text-gray-600">{row.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InteractiveWidget: React.FC<{ data: any }> = ({ data }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="bg-white rounded-lg border">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium">System Overview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-600">Active Operations</p>
                <p className="text-xl font-bold text-blue-900">24</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-green-600">Completed Today</p>
                <p className="text-xl font-bold text-green-900">156</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium">Detailed Information</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Machine Utilization:</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Cycle Time:</span>
                <span className="font-medium">4.2 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quality Rate:</span>
                <span className="font-medium">99.2%</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="actions" className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Users className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Flag Issue
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CustomWidget: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="font-medium mb-4">{data?.title || 'Custom Content'}</h4>
      <div className="prose max-w-none">
        {data?.html ? (
          <div dangerouslySetInnerHTML={{ __html: data.html }} />
        ) : (
          <div className="text-gray-500 text-center py-8">
            Custom content would appear here
          </div>
        )}
      </div>
    </div>
  );
};