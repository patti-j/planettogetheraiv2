import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
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
  FileImage
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
  type: string;
  config: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  createdByMax: boolean;
}

export default function CanvasPage() {
  const { aiTheme } = useAITheme();
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Fetch canvas widgets from API (created by Max AI)
  const { data: canvasWidgets, isLoading } = useQuery({
    queryKey: ['/api/canvas/widgets'],
    queryFn: async () => {
      const response = await fetch('/api/canvas/widgets');
      if (!response.ok) {
        throw new Error('Failed to fetch canvas widgets');
      }
      return response.json();
    }
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

  // Convert API widgets to canvas items format
  const convertWidgetToCanvasItem = (widget: CanvasWidget): CanvasItem => {
    return {
      id: widget.id.toString(),
      type: widget.type as any,
      title: widget.title,
      content: widget.config?.data || widget.config,
      width: widget.size?.width ? `${widget.size?.width || 400}px` : undefined,
      height: widget.size?.height ? `${widget.size.height}px` : undefined,
      position: widget.position
    };
  };

  // Combine localStorage items with API widgets
  const allItems = [
    ...items,
    ...(canvasWidgets?.filter((w: CanvasWidget) => w.isVisible).map(convertWidgetToCanvasItem) || [])
  ];

  const renderCanvasItem = (item: CanvasItem) => {
    switch (item.type) {
      case 'dashboard':
        return <DashboardWidget data={item.content} />;
      case 'chart':
        return <ChartWidget data={item.content} />;
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

  const confirmClearCanvas = () => {
    setItems([]);
    setShowClearConfirmation(false);
    toast({
      title: "Canvas Cleared",
      description: "All canvas content has been removed"
    });
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
      const shareText = `Max Canvas Content (${allItems.length} items)\n\n${allItems
        .map(item => `${item.title}: ${JSON.stringify(item.content)}`)
        .join('\n\n---\n\n')}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Max Canvas Content',
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Canvas Header */}
      <div className={`${aiTheme.gradient} text-white p-3 sm:p-6 space-y-4 sm:space-y-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:ml-0 ml-12">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Max Canvas</h1>
              <p className="text-white/80 text-sm md:text-base">Dynamic content space for AI-generated visualizations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:flex-shrink-0">
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
              <Card key={item.id} className="shadow-sm">
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

const ChartWidget: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="h-64 bg-white rounded-lg border p-4">
      <h4 className="font-medium mb-4">{data?.title || 'Production Chart'}</h4>
      <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
        <div className="text-center">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Chart visualization would appear here</p>
        </div>
      </div>
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