import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  Panel,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  EyeOff,
  Table,
  Key,
  Link2,
  Filter,
  Info,
  Target,
  HelpCircle
} from "lucide-react";

interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  relationships: SchemaRelationship[];
  description?: string;
  category: string;
}

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  unique?: boolean;
  defaultValue?: string;
}

interface SchemaRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  description?: string;
}

// Custom node component for database tables
const TableNode = ({ data }: { data: any }) => {
  const { table, showColumns, showRelationships, isFocused, isConnected } = data;
  
  const getCardClassName = () => {
    let baseClasses = "min-w-[250px] max-w-[350px] shadow-lg border-2 transition-all duration-200";
    
    if (isFocused) {
      return `${baseClasses} ring-4 ring-blue-500 ring-opacity-50 border-blue-500 scale-105`;
    } else if (isConnected) {
      return `${baseClasses} border-blue-300 bg-blue-50/30`;
    } else {
      return baseClasses;
    }
  };

  const getCardStyle = () => {
    if (isFocused || isConnected) {
      return { borderColor: '#3b82f6' };
    } else {
      return { borderColor: getCategoryColor(table.category) };
    }
  };

  return (
    <Card className={getCardClassName()} style={getCardStyle()}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Table className="w-4 h-4" />
          {table.name}
          {isFocused && <Badge variant="default" className="text-xs bg-blue-500 text-white">FOCUS</Badge>}
          <Badge variant="outline" className="text-xs">
            {table.category}
          </Badge>
        </CardTitle>
        {table.description && (
          <p className="text-xs text-gray-600 mt-1">{table.description}</p>
        )}
      </CardHeader>
      {showColumns && (
        <CardContent className="pt-0">
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {table.columns.slice(0, 10).map((column: SchemaColumn, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {column.primaryKey && <Key className="w-3 h-3 text-yellow-500" />}
                {column.foreignKey && <Link2 className="w-3 h-3 text-blue-500" />}
                <span className={column.primaryKey ? "font-bold" : ""}>{column.name}</span>
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {column.type}
                </Badge>
                {!column.nullable && <span className="text-red-500">*</span>}
              </div>
            ))}
            {table.columns.length > 10 && (
              <div className="text-xs text-gray-500 italic">
                ... and {table.columns.length - 10} more columns
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Helper function to get category colors
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Core Manufacturing': '#3b82f6', // blue
    'Organization': '#10b981', // emerald
    'Products & Inventory': '#f59e0b', // amber
    'Business Partners': '#8b5cf6', // violet
    'Sales & Orders': '#ef4444', // red
    'Manufacturing Planning': '#06b6d4', // cyan
    'System Management': '#6b7280', // gray
    'Communication': '#ec4899', // pink
    'AI & Optimization': '#7c3aed', // purple
    'Financial': '#059669', // emerald-600
    'Quality': '#dc2626', // red-600
    'default': '#64748b' // slate
  };
  return colors[category] || colors.default;
};

// Feature to table mapping - defines which tables are relevant for each manufacturing feature
const featureTableMapping: Record<string, string[]> = {
  'scheduling': [
    'production_orders', 'operations', 'resources', 'resource_capabilities', 'capabilities',
    'shift_templates', 'resource_shift_assignments', 'resource_downtime', 'resource_overtime',
    'production_versions', 'routings', 'routing_operations', 'work_centers', 'calendar_exceptions'
  ],
  'inventory': [
    'stock_items', 'inventory_transactions', 'warehouses', 'storage_locations', 
    'inventory_adjustments', 'cycle_counts', 'material_requirements', 'suppliers',
    'purchase_orders', 'goods_receipts', 'inventory_reservations'
  ],
  'production': [
    'production_orders', 'operations', 'bills_of_materials', 'bom_items', 'recipes',
    'production_versions', 'routings', 'routing_operations', 'work_centers',
    'quality_inspections', 'production_lots', 'batch_records'
  ],
  'quality': [
    'quality_inspections', 'quality_test_results', 'quality_specifications',
    'quality_control_plans', 'non_conformances', 'corrective_actions',
    'inspection_lots', 'quality_certificates', 'sampling_procedures'
  ],
  'planning': [
    'demand_forecasts', 'production_plans', 'material_requirements', 'capacity_requirements',
    'master_production_schedule', 'sales_orders', 'planned_orders', 'mrp_runs',
    'demand_planning_scenarios', 'capacity_planning'
  ],
  'maintenance': [
    'resources', 'maintenance_schedules', 'maintenance_work_orders', 'maintenance_tasks',
    'preventive_maintenance', 'equipment_history', 'spare_parts', 'maintenance_costs',
    'downtime_records', 'resource_downtime'
  ],
  'sales': [
    'sales_orders', 'customers', 'customer_contacts', 'sales_order_items',
    'delivery_schedules', 'customer_forecasts', 'price_lists', 'sales_contracts',
    'order_confirmations', 'shipping_notices'
  ],
  'purchasing': [
    'purchase_orders', 'suppliers', 'supplier_contacts', 'purchase_requisitions',
    'goods_receipts', 'supplier_evaluations', 'contracts', 'purchase_agreements',
    'vendor_managed_inventory', 'supplier_schedules'
  ],
  'finance': [
    'cost_centers', 'cost_allocations', 'budgets', 'actual_costs', 'variance_analysis',
    'financial_periods', 'exchange_rates', 'price_changes', 'cost_rollups',
    'profitability_analysis'
  ]
};

// Get available features from the mapping
const availableFeatures = [
  { value: 'all', label: 'All Objects' },
  { value: 'scheduling', label: 'Production Scheduling' },
  { value: 'inventory', label: 'Inventory Management' },
  { value: 'production', label: 'Production Management' },
  { value: 'quality', label: 'Quality Management' },
  { value: 'planning', label: 'Planning & Forecasting' },
  { value: 'maintenance', label: 'Maintenance Management' },
  { value: 'sales', label: 'Sales & Orders' },
  { value: 'purchasing', label: 'Purchasing & Procurement' },
  { value: 'finance', label: 'Financial Management' }
];

// Layout algorithms
const layoutAlgorithms = {
  hierarchical: (tables: SchemaTable[]) => {
    const categories = Array.from(new Set(tables.map(t => t.category)));
    const positions: { [key: string]: { x: number; y: number } } = {};
    
    categories.forEach((category, categoryIndex) => {
      const categoryTables = tables.filter(t => t.category === category);
      const startY = categoryIndex * 300;
      
      categoryTables.forEach((table, tableIndex) => {
        positions[table.name] = {
          x: tableIndex * 400,
          y: startY
        };
      });
    });
    
    return positions;
  },
  
  circular: (tables: SchemaTable[]) => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const centerX = 400;
    const centerY = 300;
    const radius = Math.max(200, tables.length * 30);
    
    tables.forEach((table, index) => {
      const angle = (index / tables.length) * 2 * Math.PI;
      positions[table.name] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    return positions;
  },
  
  grid: (tables: SchemaTable[]) => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const cols = Math.ceil(Math.sqrt(tables.length));
    
    tables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions[table.name] = {
        x: col * 400,
        y: row * 300
      };
    });
    
    return positions;
  }
};

function DataSchemaViewContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'circular' | 'grid'>('hierarchical');
  const [showColumns, setShowColumns] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTable, setFocusTable] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { fitView } = useReactFlow();

  // Fetch database schema information
  const { data: schemaData, isLoading, error } = useQuery({
    queryKey: ['/api/database/schema'],
    queryFn: async (): Promise<SchemaTable[]> => {
      try {
        const response = await fetch('/api/database/schema', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API response:', typeof data, data);
        
        // The response should be an array directly
        if (Array.isArray(data)) {
          console.log('Schema data processed:', data.length, 'tables');
          return data as SchemaTable[];
        } else {
          console.error('Expected array but got:', typeof data);
          return [];
        }
      } catch (error) {
        console.error('Failed to fetch schema data:', error);
        throw error;
      }
    },
  });

  // Get tables connected to focus table
  const getConnectedTables = useCallback((tableName: string, tables: SchemaTable[]): string[] => {
    const connected = new Set<string>();
    const targetTable = tables.find(t => t.name === tableName);
    
    if (!targetTable) return [];
    
    // Add the focus table itself
    connected.add(tableName);
    
    // Find tables this table references (through foreign keys)
    targetTable.columns.forEach(column => {
      if (column.foreignKey) {
        connected.add(column.foreignKey.table);
      }
    });
    
    // Find tables that reference this table
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.foreignKey && column.foreignKey.table === tableName) {
          connected.add(table.name);
        }
      });
    });
    
    return Array.from(connected);
  }, []);

  // Filter tables based on search, category, feature and focus mode
  const filteredTables = useMemo(() => {
    if (!schemaData || !Array.isArray(schemaData)) return [];
    
    let tables = schemaData.filter((table: SchemaTable) => {
      const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           table.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           table.columns.some((col: any) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || table.category === selectedCategory;
      
      const matchesFeature = selectedFeature === 'all' || 
                             (featureTableMapping[selectedFeature] && 
                              featureTableMapping[selectedFeature].includes(table.name));
      
      return matchesSearch && matchesCategory && matchesFeature;
    });
    
    // Apply focus mode filtering
    if (focusMode && focusTable) {
      const connectedTableNames = getConnectedTables(focusTable, schemaData);
      tables = tables.filter(table => connectedTableNames.includes(table.name));
    }
    
    // Debug logging
    console.log('Filter debug:', {
      selectedFeature,
      featureMapping: featureTableMapping[selectedFeature],
      filteredTablesCount: tables.length,
      filteredTableNames: tables.map(t => t.name)
    });
    
    return tables;
  }, [schemaData, searchTerm, selectedCategory, selectedFeature, focusMode, focusTable, getConnectedTables]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!schemaData || !Array.isArray(schemaData)) return [];
    return Array.from(new Set(schemaData.map((table: SchemaTable) => table.category)));
  }, [schemaData]);

  // Generate nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    if (!filteredTables.length) return { nodes: [], edges: [] };
    
    const positions = layoutAlgorithms[layoutType](filteredTables);
    
    // Get connected tables if in focus mode
    const connectedTableNames = focusMode && focusTable && schemaData 
      ? getConnectedTables(focusTable, schemaData) 
      : [];
    
    const flowNodes: Node[] = filteredTables.map(table => {
      const isFocused = focusMode && table.name === focusTable;
      const isConnected = focusMode && focusTable && connectedTableNames.includes(table.name) && table.name !== focusTable;
      
      return {
        id: table.name,
        type: 'default',
        position: positions[table.name],
        data: { 
          table, 
          showColumns, 
          showRelationships,
          isFocused,
          isConnected,
          label: <TableNode data={{ table, showColumns, showRelationships, isFocused, isConnected }} />
        },
        style: {
          background: 'transparent',
          border: 'none',
        }
      };
    });

    const flowEdges: Edge[] = [];
    
    if (showRelationships) {
      filteredTables.forEach(table => {
        table.relationships.forEach(rel => {
          if (filteredTables.some(t => t.name === rel.toTable)) {
            const isHighlighted = focusMode && focusTable && 
              (rel.fromTable === focusTable || rel.toTable === focusTable || 
               (connectedTableNames.includes(rel.fromTable) && connectedTableNames.includes(rel.toTable)));
            
            flowEdges.push({
              id: `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}`,
              source: rel.fromTable,
              target: rel.toTable,
              type: 'smoothstep',
              animated: !!isHighlighted,
              style: { 
                stroke: isHighlighted ? '#3b82f6' : getCategoryColor(table.category),
                strokeWidth: isHighlighted ? 3 : 2,
                opacity: focusMode && !isHighlighted ? 0.3 : 1,
              },
              label: `${rel.type}`,
              labelStyle: { 
                fontSize: 10,
                fill: isHighlighted ? '#3b82f6' : '#666',
                fontWeight: isHighlighted ? 'bold' : 'normal',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isHighlighted ? '#3b82f6' : getCategoryColor(table.category),
              }
            });
          }
        });
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [filteredTables, layoutType, showColumns, showRelationships, focusMode, focusTable, schemaData, getConnectedTables]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // Auto-fit view when filters change to show all filtered tables
  useEffect(() => {
    if (filteredTables.length > 0) {
      // Use a small delay to ensure nodes are rendered before fitting
      const timer = setTimeout(() => {
        fitView({ 
          padding: 0.2,
          duration: 800,
          includeHiddenNodes: false 
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedFeature, selectedCategory, focusMode, focusTable, searchTerm, layoutType, filteredTables.length, fitView]);

  const handleTableClick = useCallback((event: any, node: Node) => {
    setSelectedTable(node.id);
    
    // If focus mode is enabled, clicking a table focuses on it
    if (focusMode) {
      setFocusTable(node.id);
    }
  }, [focusMode]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Data Schema View</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading database schema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Schema loading error:', error);
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Data Schema View</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Failed to load database schema. Please try again.</p>
            <pre className="mt-2 text-xs text-red-500">{String(error)}</pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add debugging
  console.log('Render check:', { 
    schemaDataExists: !!schemaData, 
    isArray: Array.isArray(schemaData), 
    length: schemaData?.length,
    filteredTablesLength: filteredTables.length,
    categoriesLength: categories.length
  });

  // Handle empty data case
  if (!schemaData || schemaData.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Data Schema View</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Database Schema Available</h3>
            <p className="text-gray-600 mb-4">
              Unable to load database schema information. This could be due to:
            </p>
            <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
              <li>• Database connection issues</li>
              <li>• No tables in the database</li>
              <li>• Permission restrictions</li>
            </ul>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Mobile Optimized with proper hamburger menu spacing */}
      <div className="border-b bg-white px-3 sm:px-6 py-2 sm:py-4 relative z-10">
        {/* Title Row - Compact on Mobile with hamburger menu clearance */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 ml-12 md:ml-0">
          <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h1 className="text-lg sm:text-2xl font-bold">Data Schema</h1>
          <Badge variant="outline" className="text-xs">
            {filteredTables.length}
          </Badge>
          {selectedFeature !== 'all' && (
            <Badge variant="default" className="bg-emerald-500 text-xs hidden sm:flex">
              <Filter className="w-3 h-3 mr-1" />
              {availableFeatures.find(f => f.value === selectedFeature)?.label}
            </Badge>
          )}
          {focusMode && focusTable && (
            <Badge variant="default" className="bg-blue-500 text-xs hidden md:flex">
              Focus: {focusTable}
            </Badge>
          )}
        </div>
        
        {/* Controls - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 sm:gap-4">
          {/* Search - Full width on mobile */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          
          {/* Feature Filter - Priority on mobile */}
          <Select value={selectedFeature} onValueChange={setSelectedFeature}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Select feature" />
            </SelectTrigger>
            <SelectContent>
              {availableFeatures.map(feature => (
                <SelectItem key={feature.value} value={feature.value}>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-500" />
                    {feature.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Layout - Hidden on mobile, compact on tablet */}
          <Select value={layoutType} onValueChange={(value: any) => setLayoutType(value)}>
            <SelectTrigger className="w-full sm:w-32 hidden sm:block">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hierarchical">Tree</SelectItem>
              <SelectItem value="circular">Circle</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Toggles - Compact on all screens */}
          <div className="flex items-center gap-3 sm:gap-4 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1">
              <Switch
                id="show-columns"
                checked={showColumns}
                onCheckedChange={setShowColumns}
                className="scale-75 sm:scale-100"
              />
              <Label htmlFor="show-columns" className="text-xs sm:text-sm">Fields</Label>
            </div>
            
            <div className="flex items-center gap-1">
              <Switch
                id="show-relationships"
                checked={showRelationships}
                onCheckedChange={setShowRelationships}
                className="scale-75 sm:scale-100"
              />
              <Label htmlFor="show-relationships" className="text-xs sm:text-sm">Links</Label>
            </div>
            {/* Focus toggle - compact mobile */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      id="focus-mode"
                      checked={focusMode}
                      onCheckedChange={(checked) => {
                        setFocusMode(checked);
                        if (!checked) {
                          setFocusTable(null);
                        }
                      }}
                      className="scale-75 sm:scale-100"
                    />
                    <Label htmlFor="focus-mode" className="text-xs sm:text-sm flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Focus
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Focus mode shows only a selected table and its connected relationships. 
                    Click any table while focus mode is enabled to isolate its network.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Focus Controls - Separate row on mobile when active */}
        {focusMode && (
          <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Click any table to focus on its relationships</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select 
                value={focusTable || ""} 
                onValueChange={(value) => setFocusTable(value || null)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Or select a table to focus on..." />
                </SelectTrigger>
                <SelectContent>
                  {schemaData?.map(table => (
                    <SelectItem key={table.name} value={table.name}>
                      <div className="flex items-center gap-2">
                        <Table className="w-3 h-3" />
                        {table.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {focusTable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFocusMode(false);
                    setFocusTable(null);
                  }}
                  className="shrink-0"
                >
                  Clear Focus
                </Button>
              )}
            </div>
            
            {focusTable && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                <Target className="w-4 h-4 inline mr-1" />
                Showing <strong>{focusTable}</strong> and its connected tables
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schema Diagram */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleTableClick}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeStrokeColor={(n) => getCategoryColor(n.data?.table?.category || 'default')}
            nodeColor={(n) => getCategoryColor(n.data?.table?.category || 'default')}
            nodeBorderRadius={2}
          />
          
          <Panel position="bottom-right">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Legend
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3 text-yellow-500" />
                    <span>Primary Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3 h-3 text-blue-500" />
                    <span>Foreign Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    <span>Required Field</span>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-1">
                  <h4 className="font-medium">Categories:</h4>
                  {categories.slice(0, 5).map(category => (
                    <div key={category} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      <span className="text-xs">{category}</span>
                    </div>
                  ))}
                  {categories.length > 5 && (
                    <span className="text-xs text-gray-500">+{categories.length - 5} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function DataSchemaView() {
  return (
    <ReactFlowProvider>
      <DataSchemaViewContent />
    </ReactFlowProvider>
  );
}