import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WidgetDesignStudio from '@/components/widget-design-studio';
import { 
  Plus, 
  Settings, 
  Zap, 
  BarChart3, 
  PieChart, 
  Gauge, 
  Table, 
  AlertTriangle,
  Factory,
  Users,
  Target,
  Activity,
  Bell,
  CheckCircle,
  Calendar,
  Clock,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { WIDGET_TEMPLATES, WidgetTemplate } from '@/lib/widget-library';

export default function WidgetStudio() {
  const [designStudioOpen, setDesignStudioOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Templates', count: WIDGET_TEMPLATES.length },
    { value: 'analytics', label: 'Analytics', count: WIDGET_TEMPLATES.filter(t => t.category === 'analytics').length },
    { value: 'operations', label: 'Operations', count: WIDGET_TEMPLATES.filter(t => t.category === 'operations').length },
    { value: 'management', label: 'Management', count: WIDGET_TEMPLATES.filter(t => t.category === 'management').length },
    { value: 'custom', label: 'Custom', count: WIDGET_TEMPLATES.filter(t => t.category === 'custom').length }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? WIDGET_TEMPLATES 
    : WIDGET_TEMPLATES.filter(t => t.category === selectedCategory);

  const complexityColors = {
    basic: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const targetSystemColors = {
    cockpit: 'bg-blue-100 text-blue-800',
    analytics: 'bg-purple-100 text-purple-800',
    canvas: 'bg-orange-100 text-orange-800',
    dashboard: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Universal Widget Studio
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-0">
                Create widgets for Cockpit, Analytics, Max AI Canvas, and Custom Dashboards
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <Button 
              onClick={() => setDesignStudioOpen(true)}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Create New Widget
            </Button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{WIDGET_TEMPLATES.length} Templates Available</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
            {categories.map(category => (
              <TabsTrigger 
                key={category.value} 
                value={category.value} 
                className="flex items-center gap-1 text-xs md:text-sm p-2 md:p-3"
              >
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4 md:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200"
                  onClick={() => setDesignStudioOpen(true)}
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <template.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${complexityColors[template.complexity]}`}
                      >
                        {template.complexity}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm line-clamp-3">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {template.targetSystems.slice(0, 3).map(system => (
                        <Badge 
                          key={system}
                          variant="outline" 
                          className={`text-xs ${targetSystemColors[system as keyof typeof targetSystemColors]}`}
                        >
                          {system}
                        </Badge>
                      ))}
                      {template.targetSystems.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.targetSystems.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">Type: {template.type}</span>
                      <span className="capitalize">{template.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* System Integration Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              Cross-System Integration
            </CardTitle>
            <CardDescription className="text-sm">
              Create widgets once and deploy them across multiple systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Factory className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Cockpit Dashboard</h4>
                  <p className="text-sm text-muted-foreground">Production monitoring</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Analytics Page</h4>
                  <p className="text-sm text-muted-foreground">Data visualization</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Max AI Canvas</h4>
                  <p className="text-sm text-muted-foreground">AI-powered insights</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Target className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium">Custom Dashboards</h4>
                  <p className="text-sm text-muted-foreground">Flexible layouts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget Design Studio Dialog */}
      <WidgetDesignStudio
        open={designStudioOpen}
        onOpenChange={setDesignStudioOpen}
        onWidgetCreate={(widget, systems) => {
          console.log('Widget created:', widget, 'for systems:', systems);
        }}
      />
    </div>
  );
}