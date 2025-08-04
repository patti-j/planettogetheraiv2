import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  Edit3, 
  Grid, 
  BarChart3, 
  FileText, 
  Smartphone, 
  Monitor,
  TabletSmartphone as TabsIcon,
  Palette,
  Component,
  Database,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useDeviceType } from '@/hooks/useDeviceType';

interface DesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  type: 'grid' | 'tabs' | 'dashboard' | 'custom';
  category: string;
  preview?: string;
}

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  targetPlatform: 'mobile' | 'desktop' | 'both';
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  widgetCount: number;
}

const pageTemplates: PageTemplate[] = [
  {
    id: 'production-overview',
    name: 'Production Overview',
    description: 'Comprehensive production monitoring and control',
    type: 'dashboard',
    category: 'Operations'
  },
  {
    id: 'quality-dashboard',
    name: 'Quality Dashboard',
    description: 'Quality metrics and compliance tracking',
    type: 'grid',
    category: 'Quality'
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management', 
    description: 'Stock levels, transactions, and forecasting',
    type: 'tabs',
    category: 'Inventory'
  },
  {
    id: 'analytics-hub',
    name: 'Analytics Hub',
    description: 'Advanced analytics and reporting center',
    type: 'custom',
    category: 'Analytics'
  }
];

const widgetTemplates: WidgetTemplate[] = [
  {
    id: 'kpi-card',
    name: 'KPI Card',
    description: 'Key performance indicator display',
    type: 'kpi',
    category: 'Metrics',
    targetPlatform: 'both'
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Time-series data visualization',
    type: 'chart',
    category: 'Charts',
    targetPlatform: 'both'
  },
  {
    id: 'status-table',
    name: 'Status Table',
    description: 'Tabular data with status indicators',
    type: 'table',
    category: 'Data',
    targetPlatform: 'desktop'
  },
  {
    id: 'mobile-list',
    name: 'Mobile List',
    description: 'Compact list view for mobile',
    type: 'list',
    category: 'Mobile',
    targetPlatform: 'mobile'
  }
];

const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'factory-overview',
    name: 'Factory Overview',
    description: 'Complete factory status at a glance',
    category: 'Operations',
    widgetCount: 8
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level business metrics',
    category: 'Management',
    widgetCount: 6
  },
  {
    id: 'maintenance-center',
    name: 'Maintenance Center',
    description: 'Equipment health and maintenance schedules',
    category: 'Maintenance',
    widgetCount: 5
  }
];

export function DesignStudio({ open, onOpenChange }: DesignStudioProps) {
  console.log("🎨 DesignStudio render - open:", open);
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [activeTab, setActiveTab] = useState('pages');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Operations', 'Quality', 'Inventory', 'Analytics', 'Management', 'Maintenance', 'Mobile'];

  const filteredPageTemplates = pageTemplates.filter(template => 
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (searchTerm === '' || template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredWidgetTemplates = widgetTemplates.filter(template =>
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (searchTerm === '' || template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDashboardTemplates = dashboardTemplates.filter(template =>
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (searchTerm === '' || template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreatePage = (template: PageTemplate) => {
    // TODO: Implement page creation
    console.log('Creating page from template:', template);
  };

  const handleCreateWidget = (template: WidgetTemplate) => {
    // TODO: Implement widget creation
    console.log('Creating widget from template:', template);
  };

  const handleCreateDashboard = (template: DashboardTemplate) => {
    // TODO: Implement dashboard creation
    console.log('Creating dashboard from template:', template);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log("🎨 Design Studio dialog onOpenChange:", newOpen);
      onOpenChange(newOpen);
    }}>
      <DialogContent className={`
        ${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-6xl max-h-[85vh]'} 
        overflow-hidden flex flex-col
      `}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Design Studio
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create and manage pages, dashboards, and widgets in one integrated workspace
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 p-4 border-b flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="pages" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                {!isMobile && 'Pages'}
              </TabsTrigger>
              <TabsTrigger value="widgets" className="flex items-center gap-2">
                <Component className="w-4 h-4" />
                {!isMobile && 'Widgets'}
              </TabsTrigger>
              <TabsTrigger value="dashboards" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {!isMobile && 'Dashboards'}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="pages" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredPageTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground">
                                {template.type === 'grid' && <Grid className="w-4 h-4" />}
                                {template.type === 'tabs' && <TabsIcon className="w-4 h-4" />}
                                {template.type === 'dashboard' && <BarChart3 className="w-4 h-4" />}
                                {template.type === 'custom' && <Settings className="w-4 h-4" />}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-4">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleCreatePage(template)}
                                className="flex-1"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Create
                              </Button>
                              <Button variant="outline" size="sm">
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="widgets" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredWidgetTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {template.category}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs flex items-center gap-1"
                                  >
                                    {template.targetPlatform === 'mobile' && <Smartphone className="w-3 h-3" />}
                                    {template.targetPlatform === 'desktop' && <Monitor className="w-3 h-3" />}
                                    {template.targetPlatform === 'both' && <Grid className="w-3 h-3" />}
                                    {template.targetPlatform}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-4">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleCreateWidget(template)}
                                className="flex-1"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Create
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="dashboards" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredDashboardTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {template.widgetCount} widgets
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-4">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleCreateDashboard(template)}
                                className="flex-1"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Create
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}