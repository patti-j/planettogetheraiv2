import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Download, 
  Share2, 
  Maximize2, 
  Minimize2,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { useAITheme } from '@/hooks/use-ai-theme';

interface CanvasItem {
  id: string;
  type: 'dashboard' | 'chart' | 'table' | 'image' | 'interactive' | 'custom';
  title: string;
  content: any;
  width?: string;
  height?: string;
  position?: { x: number; y: number };
}

interface MaxCanvasProps {
  isVisible: boolean;
  onClose: () => void;
  items: CanvasItem[];
  onUpdateItems: (items: CanvasItem[]) => void;
}

export const MaxCanvas: React.FC<MaxCanvasProps> = ({
  isVisible,
  onClose,
  items,
  onUpdateItems
}) => {
  const { aiTheme } = useAITheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isVisible) return null;

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
    onUpdateItems([]);
  };

  const handleExport = () => {
    // Export canvas content as JSON or image
    const canvasData = {
      timestamp: new Date().toISOString(),
      items: items
    };
    const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `max-canvas-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border-t border-gray-200 flex flex-col h-80">
      {/* Canvas container - inline within Max window */}
      <div className="flex flex-col h-full relative">

        {/* Canvas Header - Compact inline header */}
        <div className={`${aiTheme.gradient} text-white p-2 flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <BarChart3 className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">Canvas</h3>
            </div>
            
            {/* Header Action Buttons - Compact */}
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCanvas}
                    className="text-white hover:bg-white/20 p-1"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1"
                title="Close Canvas"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Content Area - Compact for inline display */}
        <div className="flex-1 overflow-auto bg-gray-50 p-3 min-h-0">
          {items.length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: '280px' }}>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Canvas is ready</h4>
                <p className="text-xs text-gray-600 mb-2">Ask Max to create visualizations!</p>
                <div className="text-xs text-gray-500">
                  Try: "Show me job data" or "Create a chart"
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {renderCanvasItem(item)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
      <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
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
          <thead className="bg-gray-50">
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

export default MaxCanvas;