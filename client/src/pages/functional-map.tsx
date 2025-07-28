import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Factory, 
  Package, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Truck, 
  DollarSign,
  Search,
  Filter,
  Zap,
  Target,
  Wrench,
  Shield,
  TrendingUp,
  Database,
  Brain,
  Workflow,
  Map,
  ArrowRight,
  Info
} from 'lucide-react';
import { Link } from 'wouter';

interface FunctionalArea {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'core' | 'planning' | 'optimization' | 'management' | 'analytics';
  connections: string[];
  features: string[];
  dataTypes: string[];
  route?: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

const functionalAreas: FunctionalArea[] = [
  {
    id: 'production-scheduling',
    name: 'Production Scheduling',
    description: 'Schedule and sequence production orders across resources with capacity optimization',
    icon: <Calendar className="w-6 h-6" />,
    category: 'core',
    connections: ['resource-management', 'capacity-planning', 'inventory-management'],
    features: ['Order sequencing', 'Resource allocation', 'Timeline management', 'Constraint handling'],
    dataTypes: ['Production Orders', 'Operations', 'Resources', 'Shift Templates'],
    route: '/mobile-schedule',
    color: 'bg-blue-500',
    priority: 'high'
  },
  {
    id: 'resource-management',
    name: 'Resource Management',
    description: 'Manage manufacturing resources, capabilities, and availability',
    icon: <Factory className="w-6 h-6" />,
    category: 'core',
    connections: ['production-scheduling', 'capacity-planning', 'maintenance-management'],
    features: ['Resource tracking', 'Capability mapping', 'Shift assignments', 'Downtime tracking'],
    dataTypes: ['Resources', 'Capabilities', 'Resource Shift Assignments', 'Resource Downtime'],
    route: '/master-data',
    color: 'bg-green-500',
    priority: 'high'
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    description: 'Track stock levels, manage inventory flow, and optimize inventory positions',
    icon: <Package className="w-6 h-6" />,
    category: 'core',
    connections: ['production-scheduling', 'procurement', 'sales-orders'],
    features: ['Stock tracking', 'Inventory optimization', 'Reorder planning', 'Material flow'],
    dataTypes: ['Stock Items', 'Inventory Transactions', 'Warehouses', 'Stock Locations'],
    route: '/master-data',
    color: 'bg-purple-500',
    priority: 'high'
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Planning',
    description: 'Analyze and plan production capacity across time horizons',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'planning',
    connections: ['production-scheduling', 'resource-management', 'demand-planning'],
    features: ['Capacity analysis', 'Bottleneck identification', 'Load balancing', 'Future planning'],
    dataTypes: ['Capacity Scenarios', 'Resource Capacity', 'Demand Forecasts'],
    route: '/capacity-planning',
    color: 'bg-orange-500',
    priority: 'high'
  },
  {
    id: 'demand-planning',
    name: 'Demand Planning',
    description: 'Forecast demand and align production plans with market requirements',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'planning',
    connections: ['capacity-planning', 'sales-orders', 'inventory-management'],
    features: ['Demand forecasting', 'Market analysis', 'Sales alignment', 'Production planning'],
    dataTypes: ['Demand Forecasts', 'Sales History', 'Market Drivers'],
    route: '/demand-planning',
    color: 'bg-indigo-500',
    priority: 'medium'
  },
  {
    id: 'quality-management',
    name: 'Quality Management',
    description: 'Ensure product quality through testing, inspections, and control processes',
    icon: <Shield className="w-6 h-6" />,
    category: 'management',
    connections: ['production-scheduling', 'inventory-management'],
    features: ['Quality control', 'Testing protocols', 'Compliance tracking', 'Defect management'],
    dataTypes: ['Quality Tests', 'Inspection Results', 'Quality Standards'],
    color: 'bg-red-500',
    priority: 'medium'
  },
  {
    id: 'maintenance-management',
    name: 'Maintenance Management',
    description: 'Plan and execute preventive and corrective maintenance activities',
    icon: <Wrench className="w-6 h-6" />,
    category: 'management',
    connections: ['resource-management', 'production-scheduling'],
    features: ['Preventive maintenance', 'Work orders', 'Equipment tracking', 'Downtime analysis'],
    dataTypes: ['Maintenance Plans', 'Work Orders', 'Equipment History'],
    color: 'bg-yellow-500',
    priority: 'medium'
  },
  {
    id: 'sales-orders',
    name: 'Sales & Orders',
    description: 'Manage customer orders and sales processes',
    icon: <Users className="w-6 h-6" />,
    category: 'core',
    connections: ['production-scheduling', 'inventory-management', 'demand-planning'],
    features: ['Order management', 'Customer tracking', 'Delivery planning', 'Order promising'],
    dataTypes: ['Sales Orders', 'Customers', 'Order Items'],
    color: 'bg-teal-500',
    priority: 'high'
  },
  {
    id: 'procurement',
    name: 'Procurement',
    description: 'Source materials and manage supplier relationships',
    icon: <Truck className="w-6 h-6" />,
    category: 'management',
    connections: ['inventory-management', 'production-scheduling'],
    features: ['Purchase orders', 'Supplier management', 'Material planning', 'Cost optimization'],
    dataTypes: ['Purchase Orders', 'Vendors', 'Purchase Items'],
    color: 'bg-cyan-500',
    priority: 'medium'
  },
  {
    id: 'financial-management',
    name: 'Financial Management',
    description: 'Track costs, analyze profitability, and manage financial performance',
    icon: <DollarSign className="w-6 h-6" />,
    category: 'analytics',
    connections: ['procurement', 'sales-orders'],
    features: ['Cost tracking', 'Profitability analysis', 'Budget management', 'Financial reporting'],
    dataTypes: ['Cost Centers', 'Financial Transactions', 'Budgets'],
    color: 'bg-emerald-500',
    priority: 'low'
  },
  {
    id: 'cockpit-management',
    name: 'Cockpit Management',
    description: 'Create customizable dashboards for operational oversight',
    icon: <Target className="w-6 h-6" />,
    category: 'analytics',
    connections: ['production-scheduling', 'capacity-planning', 'resource-management'],
    features: ['Dashboard creation', 'Widget configuration', 'Real-time monitoring', 'KPI tracking'],
    dataTypes: ['Cockpit Layouts', 'Widgets', 'Alerts'],
    route: '/cockpit',
    color: 'bg-pink-500',
    priority: 'medium'
  },
  {
    id: 'data-management',
    name: 'Data Management',
    description: 'Import, validate, and manage master data across the system',
    icon: <Database className="w-6 h-6" />,
    category: 'management',
    connections: ['production-scheduling', 'resource-management', 'inventory-management'],
    features: ['Data import/export', 'Data validation', 'Template management', 'Schema visualization'],
    dataTypes: ['All Master Data Types'],
    route: '/master-data',
    color: 'bg-slate-500',
    priority: 'high'
  }
];

const categories = [
  { id: 'all', name: 'All Areas', color: 'bg-gray-500' },
  { id: 'core', name: 'Core Operations', color: 'bg-blue-500' },
  { id: 'planning', name: 'Planning & Forecasting', color: 'bg-orange-500' },
  { id: 'optimization', name: 'Optimization', color: 'bg-purple-500' },
  { id: 'management', name: 'Management', color: 'bg-green-500' },
  { id: 'analytics', name: 'Analytics & Insights', color: 'bg-pink-500' }
];

export default function FunctionalMap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'network'>('grid');

  // Filter functional areas
  const filteredAreas = useMemo(() => {
    return functionalAreas.filter(area => {
      const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           area.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           area.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || area.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Get connected areas for highlighting
  const getConnectedAreas = (areaId: string) => {
    const area = functionalAreas.find(a => a.id === areaId);
    return area ? area.connections : [];
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-500';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Map className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Functional Map</h1>
            </div>
            <p className="text-gray-600 mt-1">
              Explore the system's functional areas and understand how they connect
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
            <Button
              variant={viewMode === 'network' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('network')}
            >
              Network View
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search functional areas, features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          <span>{filteredAreas.length} of {functionalAreas.length} areas shown</span>
          <span>•</span>
          <span>{categories.length - 1} categories</span>
          {selectedArea && (
            <>
              <span>•</span>
              <span className="text-blue-600 font-medium">
                {getConnectedAreas(selectedArea).length} connections highlighted
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAreas.map(area => {
              const isSelected = selectedArea === area.id;
              const isConnected = selectedArea && getConnectedAreas(selectedArea).includes(area.id);
              const shouldHighlight = !selectedArea || isSelected || isConnected;
              
              return (
                <Card 
                  key={area.id}
                  className={`
                    cursor-pointer transition-all duration-200 hover:shadow-lg
                    ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                    ${isConnected ? 'ring-2 ring-green-400' : ''}
                    ${!shouldHighlight ? 'opacity-40' : ''}
                  `}
                  onClick={() => setSelectedArea(isSelected ? null : area.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${area.color} text-white`}>
                        {area.icon}
                      </div>
                      <Badge className={getPriorityBadge(area.priority)}>
                        {area.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {area.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(area.category)}`} />
                      <span className="text-xs text-gray-500 capitalize">
                        {area.category.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Key Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {area.features.slice(0, 3).map(feature => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {area.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{area.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Connections */}
                    {area.connections.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">
                          Connects to ({area.connections.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {area.connections.slice(0, 2).map(connectionId => {
                            const connectedArea = functionalAreas.find(a => a.id === connectionId);
                            return connectedArea ? (
                              <TooltipProvider key={connectionId}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs">
                                      {connectedArea.name.split(' ')[0]}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{connectedArea.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null;
                          })}
                          {area.connections.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{area.connections.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {area.route && (
                      <div className="pt-2 border-t">
                        <Link href={area.route}>
                          <Button size="sm" className="w-full" variant="outline">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Explore
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Network View - Placeholder for future implementation */
          <div className="flex items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Network View</h3>
              <p className="text-gray-600">
                Interactive network visualization coming soon. 
                <br />
                Use Grid View to explore functional connections.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Area Details Panel */}
      {selectedArea && (
        <div className="bg-white border-t border-gray-200 p-6">
          {(() => {
            const area = functionalAreas.find(a => a.id === selectedArea);
            if (!area) return null;
            
            return (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${area.color} text-white`}>
                      {area.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{area.name}</h3>
                      <p className="text-gray-600">{area.description}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedArea(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {area.features.map(feature => (
                        <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {area.dataTypes.map(dataType => (
                        <Badge key={dataType} variant="secondary" className="text-xs">
                          {dataType}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Connected Areas</h4>
                    <div className="space-y-2">
                      {area.connections.map(connectionId => {
                        const connectedArea = functionalAreas.find(a => a.id === connectionId);
                        return connectedArea ? (
                          <div key={connectionId} className="flex items-center gap-2 text-sm">
                            <div className={`w-3 h-3 rounded-full ${connectedArea.color}`} />
                            <span className="text-gray-700">{connectedArea.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                {area.route && (
                  <div className="mt-6 pt-6 border-t">
                    <Link href={area.route}>
                      <Button>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Go to {area.name}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}