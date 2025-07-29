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
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  HelpCircle,
  X,
  Maximize,
  Minimize,
  CheckSquare,
  Square,
  Settings,
  Plus,
  Minus,
  RefreshCw
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
    'production_orders', 'planned_orders', 'operations', 'resources', 'resource_capabilities', 'capabilities',
    'shift_templates', 'resource_shift_assignments', 'resource_downtime', 'resource_overtime',
    'production_versions', 'routings', 'routing_operations', 'work_centers', 'calendar_exceptions',
    'recipes', 'bills_of_materials', 'bom_items', 'bom_material_requirements', 'bom_product_outputs', 'capacity_planning_scenarios'
  ],
  'inventory': [
    'stock_items', 'inventory_transactions', 'warehouses', 'storage_locations', 
    'inventory_adjustments', 'cycle_counts', 'material_requirements', 'suppliers',
    'purchase_orders', 'goods_receipts', 'inventory_reservations'
  ],
  'production': [
    'production_orders', 'operations', 'bills_of_materials', 'bom_items', 'bom_material_requirements', 'bom_product_outputs', 'recipes',
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
  ],
  'engineering': [
    'bills_of_materials', 'bom_items', 'bom_material_requirements', 'bom_product_outputs', 'recipes', 'recipe_operations', 'recipe_phases', 'recipe_operation_relationships', 'recipe_material_assignments', 'routings', 'routing_operations',
    'production_versions', 'work_centers', 'product_masters', 'products',
    'product_categories', 'product_structures', 'engineering_changes',
    'specifications', 'documents', 'alternate_routings', 'operations',
    'capabilities', 'resource_capabilities', 'quality_specifications',
    'material_specifications', 'process_parameters', 'technical_documents',
    'resources', 'plants', 'resource_requirements', 'storage_locations'
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
  { value: 'finance', label: 'Financial Management' },
  { value: 'engineering', label: 'Engineering & Product Design' }
];

// Collision detection helper function
const hasCollision = (pos1: { x: number; y: number }, pos2: { x: number; y: number }, cardWidth: number = 320, cardHeight: number = 200, padding: number = 20) => {
  const totalWidth = cardWidth + padding;
  const totalHeight = cardHeight + padding;
  
  return !(pos1.x + totalWidth < pos2.x || 
           pos2.x + totalWidth < pos1.x || 
           pos1.y + totalHeight < pos2.y || 
           pos2.y + totalHeight < pos1.y);
};

// Resolve collision by finding nearest non-overlapping position
const resolveCollision = (newPos: { x: number; y: number }, existingPositions: { x: number; y: number }[], cardWidth: number = 320, cardHeight: number = 200) => {
  let resolvedPos = { ...newPos };
  const maxAttempts = 20;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    let hasAnyCollision = false;
    
    for (const existing of existingPositions) {
      if (hasCollision(resolvedPos, existing, cardWidth, cardHeight)) {
        hasAnyCollision = true;
        // Try moving right first, then down
        if (attempts % 2 === 0) {
          resolvedPos.x += cardWidth + 50;
        } else {
          resolvedPos.y += cardHeight + 50;
          resolvedPos.x = newPos.x; // Reset x position
        }
        break;
      }
    }
    
    if (!hasAnyCollision) break;
    attempts++;
  }
  
  return resolvedPos;
};

// Layout algorithms with improved collision detection and spacing
const layoutAlgorithms = {
  hierarchical: (tables: SchemaTable[]) => {
    const categories = Array.from(new Set(tables.map(t => t.category)));
    const positions: { [key: string]: { x: number; y: number } } = {};
    const existingPositions: { x: number; y: number }[] = [];
    
    // Dynamic spacing based on table count and content
    const minCardWidth = 320;
    const minCardHeight = 200;
    const padding = 50;
    
    let currentY = 0;
    
    categories.forEach((category, categoryIndex) => {
      const categoryTables = tables.filter(t => t.category === category);
      
      // Calculate optimal columns based on table count and screen utilization
      const maxCols = Math.max(2, Math.min(5, Math.ceil(Math.sqrt(categoryTables.length * 2))));
      const cols = Math.min(maxCols, categoryTables.length);
      
      // Dynamic spacing based on column count
      const horizontalSpacing = minCardWidth + padding;
      
      categoryTables.forEach((table, tableIndex) => {
        const row = Math.floor(tableIndex / cols);
        const col = tableIndex % cols;
        
        // Estimate card height based on column count (more columns = taller card)
        const estimatedHeight = minCardHeight + (table.columns.length > 10 ? 60 : table.columns.length * 6);
        
        const proposedPosition = {
          x: col * horizontalSpacing,
          y: currentY + row * (estimatedHeight + padding)
        };
        
        // Use collision detection as backup safety measure
        const finalPosition = resolveCollision(proposedPosition, existingPositions, minCardWidth, estimatedHeight);
        positions[table.name] = finalPosition;
        existingPositions.push(finalPosition);
      });
      
      // Update Y position for next category
      const categoryRows = Math.ceil(categoryTables.length / cols);
      const maxEstimatedHeight = Math.max(...categoryTables.map(t => 
        minCardHeight + (t.columns.length > 10 ? 60 : t.columns.length * 6)
      ));
      currentY += categoryRows * (maxEstimatedHeight + padding) + 80; // Extra space between categories
    });
    
    return positions;
  },
  
  circular: (tables: SchemaTable[]) => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const existingPositions: { x: number; y: number }[] = [];
    const centerX = 600;
    const centerY = 400;
    
    // Dynamic radius based on table count and estimated card size
    const minRadius = 350;
    const cardWidth = 320;
    const cardHeight = 200;
    
    // Calculate minimum radius to prevent overlaps
    // Use card width as the arc length and solve for radius
    const arcLength = cardWidth + 80; // Add padding
    const minRadiusForSpacing = (tables.length * arcLength) / (2 * Math.PI);
    const calculatedRadius = Math.max(minRadius, minRadiusForSpacing);
    
    tables.forEach((table, index) => {
      const angle = (index / tables.length) * 2 * Math.PI;
      const proposedPosition = {
        x: centerX + calculatedRadius * Math.cos(angle),
        y: centerY + calculatedRadius * Math.sin(angle)
      };
      
      // Use collision detection as backup
      const finalPosition = resolveCollision(proposedPosition, existingPositions, cardWidth, cardHeight);
      positions[table.name] = finalPosition;
      existingPositions.push(finalPosition);
    });
    
    return positions;
  },
  
  grid: (tables: SchemaTable[]) => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const existingPositions: { x: number; y: number }[] = [];
    
    // Dynamic grid sizing
    const minCardWidth = 320;
    const minCardHeight = 200;
    const padding = 50;
    
    // Calculate optimal grid dimensions
    const aspectRatio = 16 / 9; // Target wider than tall layout
    let cols = Math.ceil(Math.sqrt(tables.length * aspectRatio));
    cols = Math.max(2, Math.min(6, cols)); // Limit between 2-6 columns
    
    const horizontalSpacing = minCardWidth + padding;
    
    tables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Estimate card height based on column count
      const estimatedHeight = minCardHeight + (table.columns.length > 10 ? 60 : table.columns.length * 6);
      const verticalSpacing = estimatedHeight + padding;
      
      const proposedPosition = {
        x: col * horizontalSpacing,
        y: row * verticalSpacing
      };
      
      // Use collision detection to ensure no overlaps
      const finalPosition = resolveCollision(proposedPosition, existingPositions, minCardWidth, estimatedHeight);
      positions[table.name] = finalPosition;
      existingPositions.push(finalPosition);
    });
    
    return positions;
  }
};

function DataSchemaViewContent() {
  // Initialize all filter states with localStorage persistence
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return localStorage.getItem('dataSchemaSearchTerm') || '';
    } catch {
      return '';
    }
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try {
      return localStorage.getItem('dataSchemaSelectedCategory') || 'all';
    } catch {
      return 'all';
    }
  });
  
  const [selectedFeature, setSelectedFeature] = useState<string>(() => {
    try {
      return localStorage.getItem('dataSchemaSelectedFeature') || 'all';
    } catch {
      return 'all';
    }
  });
  
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'circular' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('dataSchemaLayoutType');
      return (saved as 'hierarchical' | 'circular' | 'grid') || 'hierarchical';
    } catch {
      return 'hierarchical';
    }
  });
  
  const [showColumns, setShowColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaShowColumns');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  
  const [showRelationships, setShowRelationships] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaShowRelationships');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  
  const [simplifyLines, setSimplifyLines] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaSimplifyLines');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTable, setFocusTable] = useState<string | null>(null);
  
  // Table selection functionality
  const [selectedTables, setSelectedTables] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dataSchemaSelectedTables');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [showRelatedTables, setShowRelatedTables] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaShowRelatedTables');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [tableSelectorSearch, setTableSelectorSearch] = useState("");
  
  // Initialize showLegend state from localStorage, default to true if not set
  const [showLegend, setShowLegend] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaLegendVisible');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Initialize showMiniMap state from localStorage, default to false on mobile, true on desktop
  const [showMiniMap, setShowMiniMap] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaMiniMapVisible');
      if (saved) return JSON.parse(saved);
      // Default to false on mobile (< 768px), true on desktop
      return window.innerWidth >= 768;
    } catch {
      return window.innerWidth >= 768;
    }
  });

  // Persist legend visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaLegendVisible', JSON.stringify(showLegend));
    } catch (error) {
      console.warn('Failed to save legend visibility to localStorage:', error);
    }
  }, [showLegend]);

  // Persist minimap visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaMiniMapVisible', JSON.stringify(showMiniMap));
    } catch (error) {
      console.warn('Failed to save minimap visibility to localStorage:', error);
    }
  }, [showMiniMap]);

  // Full screen mode state with localStorage persistence
  const [isFullScreen, setIsFullScreen] = useState(() => {
    try {
      const saved = localStorage.getItem('dataSchemaFullScreen');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Persist all filter states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaFullScreen', JSON.stringify(isFullScreen));
    } catch (error) {
      console.warn('Failed to save full screen mode to localStorage:', error);
    }
  }, [isFullScreen]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaSearchTerm', searchTerm);
    } catch (error) {
      console.warn('Failed to save search term to localStorage:', error);
    }
  }, [searchTerm]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaSelectedCategory', selectedCategory);
    } catch (error) {
      console.warn('Failed to save selected category to localStorage:', error);
    }
  }, [selectedCategory]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaSelectedFeature', selectedFeature);
    } catch (error) {
      console.warn('Failed to save selected feature to localStorage:', error);
    }
  }, [selectedFeature]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaLayoutType', layoutType);
    } catch (error) {
      console.warn('Failed to save layout type to localStorage:', error);
    }
  }, [layoutType]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaShowColumns', JSON.stringify(showColumns));
    } catch (error) {
      console.warn('Failed to save show columns setting to localStorage:', error);
    }
  }, [showColumns]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaShowRelationships', JSON.stringify(showRelationships));
    } catch (error) {
      console.warn('Failed to save show relationships setting to localStorage:', error);
    }
  }, [showRelationships]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaSimplifyLines', JSON.stringify(simplifyLines));
    } catch (error) {
      console.warn('Failed to save simplify lines setting to localStorage:', error);
    }
  }, [simplifyLines]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaSelectedTables', JSON.stringify(selectedTables));
    } catch (error) {
      console.warn('Failed to save selected tables to localStorage:', error);
    }
  }, [selectedTables]);

  useEffect(() => {
    try {
      localStorage.setItem('dataSchemaShowRelatedTables', JSON.stringify(showRelatedTables));
    } catch (error) {
      console.warn('Failed to save show related tables setting to localStorage:', error);
    }
  }, [showRelatedTables]);

  // Keyboard shortcuts for full screen mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // F11 key or Ctrl/Cmd + Shift + F for full screen toggle
      if (event.key === 'F11' || (event.key === 'f' && event.ctrlKey && event.shiftKey) || (event.key === 'f' && event.metaKey && event.shiftKey)) {
        event.preventDefault();
        setIsFullScreen(!isFullScreen);
      }
      // Escape key to exit full screen
      if (event.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullScreen]);
  
  const { toast } = useToast();
  const { fitView } = useReactFlow();
  
  // Manual refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate the schema cache and refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/database/schema'] });
      toast({
        title: "Schema Refreshed",
        description: "Database schema has been reloaded with latest changes.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh schema data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Always show schema by default since it loads quickly now (2-3 seconds)
  const [hasAppliedFilters, setHasAppliedFilters] = useState(true);

  // Fetch database schema information only when filters are applied
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
    enabled: Boolean(hasAppliedFilters), // Always fetch schema since it's fast now
  });

  // Filter handler functions with localStorage persistence
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Persist to localStorage
    try {
      localStorage.setItem('dataSchemaSearchTerm', value);
    } catch {}
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Persist to localStorage
    try {
      localStorage.setItem('dataSchemaSelectedCategory', value);
    } catch {}
  };

  const handleFeatureChange = (value: string) => {
    setSelectedFeature(value);
    // Persist to localStorage
    try {
      localStorage.setItem('dataSchemaSelectedFeature', value);
    } catch {}
  };

  const handleTableSelectionChange = (tables: string[]) => {
    setSelectedTables(tables);
    // Persist to localStorage
    try {
      localStorage.setItem('dataSchemaSelectedTables', JSON.stringify(tables));
    } catch {}
  };

  // Get tables connected to focus table
  const getConnectedTables = useCallback((tableName: string, tables: SchemaTable[]): string[] => {
    const connected = new Set<string>();
    const targetTable = tables.find(t => t.name === tableName);
    
    if (!targetTable) {
      console.log(`Target table ${tableName} not found in tables`);
      return [];
    }
    
    console.log(`Analyzing table ${tableName} with ${targetTable.columns.length} columns`);
    
    // Add the focus table itself
    connected.add(tableName);
    
    // Find tables this table references (through foreign keys)
    targetTable.columns.forEach(column => {
      if (column.foreignKey) {
        console.log(`${tableName}.${column.name} references ${column.foreignKey.table}.${column.foreignKey.column}`);
        connected.add(column.foreignKey.table);
      }
    });
    
    // Find tables that reference this table
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.foreignKey && column.foreignKey.table === tableName) {
          console.log(`${table.name}.${column.name} references ${tableName}.${column.foreignKey.column}`);
          connected.add(table.name);
        }
      });
    });
    
    const result = Array.from(connected);
    console.log(`Connected tables for ${tableName}:`, result);
    return result;
  }, []);

  // Get related tables for selected tables
  const getRelatedTablesForSelection = useCallback((tableNames: string[], tables: SchemaTable[]): string[] => {
    const related = new Set<string>();
    
    console.log('Getting related tables for:', tableNames);
    console.log('Available tables count:', tables.length);
    
    tableNames.forEach(tableName => {
      const connectedTables = getConnectedTables(tableName, tables);
      console.log(`Connected tables for ${tableName}:`, connectedTables);
      connectedTables.forEach(t => related.add(t));
    });
    
    const result = Array.from(related);
    console.log('Final related tables:', result);
    return result;
  }, [getConnectedTables]);

  // Filter tables based on search, category, feature, focus mode, and table selection
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
    
    // Apply table selection filtering
    if (selectedTables.length > 0) {
      if (showRelatedTables) {
        // Show selected tables and their related tables
        const relatedTables = getRelatedTablesForSelection(selectedTables, tables);
        tables = tables.filter(table => relatedTables.includes(table.name));
      } else {
        // Show only selected tables
        tables = tables.filter(table => selectedTables.includes(table.name));
      }
    }
    
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
  }, [schemaData, searchTerm, selectedCategory, selectedFeature, focusMode, focusTable, selectedTables, showRelatedTables, getConnectedTables, getRelatedTablesForSelection]);

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
            
            // Calculate better edge routing to avoid crossovers
            const sourcePos = positions[rel.fromTable];
            const targetPos = positions[rel.toTable];
            const edgeColor = isHighlighted ? '#3b82f6' : getCategoryColor(table.category);
            
            // Determine the best edge type based on relative positions
            let edgeType = 'default';
            let pathfindingType = 'grid';
            
            // Use different routing strategies based on layout and simplification setting
            if (simplifyLines) {
              edgeType = 'straight'; // Simplest routing - direct lines
            } else if (layoutType === 'hierarchical') {
              edgeType = 'step'; // Better for hierarchical layouts
            } else if (layoutType === 'circular') {
              edgeType = 'bezier'; // Smoother curves for circular layouts
            } else {
              edgeType = 'smoothstep'; // Default for grid
            }
            
            // Add visual distinction for different relationship types with one-to-many indicators
            const isDashed = rel.type === 'one-to-many' || rel.type === 'many-to-many';
            const strokeDasharray = isDashed ? '5,5' : undefined;
            
            // Determine markers and labels based on relationship type - positioned closer to objects
            let markerStart = undefined;
            let markerEnd = undefined;
            let sourceLabel = '';
            let targetLabel = '';
            
            if (rel.type === 'one-to-many') {
              // From side is "one" (simple arrow), to side is "many" (larger crow's foot)
              markerStart = {
                type: MarkerType.Arrow,
                color: edgeColor,
                width: isHighlighted ? 16 : 12,
                height: isHighlighted ? 16 : 12,
              };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: isHighlighted ? 20 : 16,
                height: isHighlighted ? 20 : 16,
              };
              sourceLabel = '1';
              targetLabel = '∞';
            } else if (rel.type === 'many-to-many') {
              // Both sides are "many" (large crow's foot on both ends)
              markerStart = {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: isHighlighted ? 20 : 16,
                height: isHighlighted ? 20 : 16,
              };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: isHighlighted ? 20 : 16,
                height: isHighlighted ? 20 : 16,
              };
              sourceLabel = '∞';
              targetLabel = '∞';
            } else if (rel.type === 'one-to-one') {
              // Both sides are "one" (larger simple arrows on both ends)
              markerStart = {
                type: MarkerType.Arrow,
                color: edgeColor,
                width: isHighlighted ? 16 : 12,
                height: isHighlighted ? 16 : 12,
              };
              markerEnd = {
                type: MarkerType.Arrow,
                color: edgeColor,
                width: isHighlighted ? 16 : 12,
                height: isHighlighted ? 16 : 12,
              };
              sourceLabel = '1';
              targetLabel = '1';
            } else {
              // Default arrow for other relationship types - larger size
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: isHighlighted ? 20 : 16,
                height: isHighlighted ? 20 : 16,
              };
              targetLabel = '→';
            }
            
            // Create main relationship line
            flowEdges.push({
              id: `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}`,
              source: rel.fromTable,
              target: rel.toTable,
              type: edgeType,
              animated: !!isHighlighted,
              style: { 
                stroke: edgeColor,
                strokeWidth: isHighlighted ? 6 : 3,
                opacity: focusMode && !isHighlighted ? 0.2 : 0.9,
                strokeDasharray: strokeDasharray,
                filter: isHighlighted ? 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.1))',
              },
              markerStart: markerStart,
              markerEnd: markerEnd
            });

            // Create two separate edges with positioned labels for better cardinality indication
            if (rel.type === 'many-to-many' || rel.type === 'one-to-many' || rel.type === 'one-to-one') {
              // Remove the main edge we just added and replace with two positioned label edges
              flowEdges.pop();
              
              // Determine source and target labels
              let sourceCardinalityLabel = '';
              let targetCardinalityLabel = '';
              
              if (rel.type === 'many-to-many') {
                sourceCardinalityLabel = '∞';
                targetCardinalityLabel = '∞';
              } else if (rel.type === 'one-to-many') {
                sourceCardinalityLabel = '1';
                targetCardinalityLabel = '∞';
              } else if (rel.type === 'one-to-one') {
                sourceCardinalityLabel = '1';
                targetCardinalityLabel = '1';
              }
              
              // Create the main relationship line without labels
              flowEdges.push({
                id: `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}`,
                source: rel.fromTable,
                target: rel.toTable,
                type: edgeType,
                animated: !!isHighlighted,
                style: { 
                  stroke: edgeColor,
                  strokeWidth: isHighlighted ? 6 : 3,
                  opacity: focusMode && !isHighlighted ? 0.2 : 0.9,
                  strokeDasharray: strokeDasharray,
                  filter: isHighlighted ? 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.1))',
                },
                markerStart: markerStart,
                markerEnd: markerEnd
              });
              
              // Add source cardinality label edge - positioned closer to source
              flowEdges.push({
                id: `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}-source-label`,
                source: rel.fromTable,
                target: rel.toTable,
                type: 'straight',
                style: { 
                  stroke: 'transparent',
                  strokeWidth: 0,
                },
                label: sourceCardinalityLabel,
                labelStyle: {
                  fontSize: '28px',
                  fill: sourceCardinalityLabel === '1' ? '#059669' : '#dc2626', // Green for "1", Red for "∞"
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: sourceCardinalityLabel === '1' ? '3px solid #059669' : '3px solid #dc2626',
                  fontFamily: 'monospace',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                },
                labelBgStyle: {
                  fill: 'rgba(255, 255, 255, 0.95)',
                  fillOpacity: 0.95,
                  rx: 6,
                  ry: 6,
                },
                labelShowBg: true,
                // This positions the label very close to the source node endpoint
                data: { labelPosition: 0.05 }
              });
              
              // Add target cardinality label edge - positioned closer to target
              flowEdges.push({
                id: `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}-target-label`,
                source: rel.fromTable,
                target: rel.toTable,
                type: 'straight',
                style: { 
                  stroke: 'transparent',
                  strokeWidth: 0,
                },
                label: targetCardinalityLabel,
                labelStyle: {
                  fontSize: '28px',
                  fill: targetCardinalityLabel === '1' ? '#059669' : '#dc2626', // Green for "1", Red for "∞"
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: targetCardinalityLabel === '1' ? '3px solid #059669' : '3px solid #dc2626',
                  fontFamily: 'monospace',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                },
                labelBgStyle: {
                  fill: 'rgba(255, 255, 255, 0.95)',
                  fillOpacity: 0.95,
                  rx: 6,
                  ry: 6,
                },
                labelShowBg: true,
                // This positions the label very close to the target node endpoint
                data: { labelPosition: 0.95 }
              });
            }
          }
        });
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [filteredTables, layoutType, showColumns, showRelationships, focusMode, focusTable, schemaData, getConnectedTables, simplifyLines]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // Auto-fit view when filters change to show all filtered tables
  useEffect(() => {
    if (filteredTables.length > 0 && nodes.length > 0) {
      // Use a longer delay to ensure nodes are fully positioned after layout changes
      const timer = setTimeout(() => {
        fitView({ 
          padding: 0.2, // Increased padding to prevent objects from being cut off
          duration: 800,
          includeHiddenNodes: false,
          minZoom: 0.05,
          maxZoom: 2.0
        });
      }, 300); // Increased delay for layout completion
      
      return () => clearTimeout(timer);
    }
  }, [selectedFeature, selectedCategory, focusMode, focusTable, searchTerm, layoutType, filteredTables.length, nodes.length, fitView]);

  const handleTableClick = useCallback((event: any, node: Node) => {
    setSelectedTable(node.id);
    
    // If focus mode is enabled, clicking a table focuses on it
    if (focusMode) {
      setFocusTable(node.id);
    }
  }, [focusMode]);

  // Handle edge hover for better line tracing
  const handleEdgeMouseEnter = useCallback((_: any, edge: Edge) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edge.id) {
          return {
            ...e,
            style: {
              ...e.style,
              strokeWidth: 5,
              stroke: '#3b82f6',
              filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.6))',
              zIndex: 1000,
            },
            animated: true,
          };
        }
        return {
          ...e,
          style: {
            ...e.style,
            opacity: 0.3,
          },
        };
      })
    );
  }, [setEdges]);

  const handleEdgeMouseLeave = useCallback(() => {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          stroke: e.style?.stroke || '#666',
          strokeWidth: e.style?.strokeWidth || 2,
          opacity: focusMode ? (e.style?.opacity || 0.8) : 0.8,
          filter: undefined,
          zIndex: 1,
        },
        animated: false,
      }))
    );
  }, [setEdges, focusMode]);

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

  // Handle cases where data is not loaded yet or empty
  if (!hasAppliedFilters) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Data Schema View</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Apply Filters to View Schema</h3>
            <p className="text-gray-600 mb-6">
              To improve performance, the database schema loads only when you apply filters. Choose what you'd like to explore:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
              <Card className="p-4 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => handleFeatureChange('scheduling')}>
                <div className="text-center">
                  <h4 className="font-semibold text-blue-600 mb-2">Production Scheduling</h4>
                  <p className="text-sm text-gray-600">Orders, operations, resources, shifts</p>
                </div>
              </Card>
              <Card className="p-4 hover:bg-green-50 cursor-pointer transition-colors" onClick={() => handleFeatureChange('inventory')}>
                <div className="text-center">
                  <h4 className="font-semibold text-green-600 mb-2">Inventory Management</h4>
                  <p className="text-sm text-gray-600">Stock, transactions, forecasts</p>
                </div>
              </Card>
              <Card className="p-4 hover:bg-purple-50 cursor-pointer transition-colors" onClick={() => handleFeatureChange('quality')}>
                <div className="text-center">
                  <h4 className="font-semibold text-purple-600 mb-2">Quality Management</h4>
                  <p className="text-sm text-gray-600">Tests, inspections, standards</p>
                </div>
              </Card>
              <Card className="p-4 hover:bg-orange-50 cursor-pointer transition-colors" onClick={() => handleCategoryChange('Core Manufacturing')}>
                <div className="text-center">
                  <h4 className="font-semibold text-orange-600 mb-2">Core Manufacturing</h4>
                  <p className="text-sm text-gray-600">Plants, resources, capabilities</p>
                </div>
              </Card>
              <Card className="p-4 hover:bg-cyan-50 cursor-pointer transition-colors" onClick={() => handleCategoryChange('Products & Inventory')}>
                <div className="text-center">
                  <h4 className="font-semibold text-cyan-600 mb-2">Products & Inventory</h4>
                  <p className="text-sm text-gray-600">BOMs, recipes, stock items</p>
                </div>
              </Card>
              <Card className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setHasAppliedFilters(true)}>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-600 mb-2">Load All Tables</h4>
                  <p className="text-sm text-gray-600">See entire database schema</p>
                </div>
              </Card>
            </div>
            <div className="text-sm text-gray-500">
              Or use the search box and filters in the header when they appear.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              onClick={() => setHasAppliedFilters(false)} 
              className="mt-4"
              variant="outline"
            >
              Go Back to Filters
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Mobile Optimized with proper hamburger menu spacing */}
      {!isFullScreen && (
        <div className="border-b bg-white px-3 sm:px-6 py-2 sm:py-4 relative z-10">
        {/* Title Row - Compact on Mobile with hamburger menu clearance */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 ml-12 md:ml-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h1 className="text-lg sm:text-2xl font-bold">Data Schema</h1>
            <Badge variant="outline" className="text-xs">
              {filteredTables.length}
            </Badge>
          </div>
          
          {/* Top Right Controls */}
          <div className="flex items-center gap-2">
            {/* Manual Refresh Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually refresh schema data to load recent changes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Fit to View Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fitView({ padding: 0.2, minZoom: 0.05, maxZoom: 2.0, duration: 800 })}
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fit to View - Center and zoom to show all tables</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* MiniMap Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMiniMap(!showMiniMap)}
                    className={showMiniMap ? 'ring-2 ring-blue-500' : ''}
                  >
                    {showMiniMap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showMiniMap ? 'Hide' : 'Show'} MiniMap</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Full Screen Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={isFullScreen ? 'ring-2 ring-green-500' : ''}
                  >
                    {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullScreen ? 'Exit' : 'Enter'} Full Screen (F11)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>

          {/* Table Selection Button */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTableSelector(!showTableSelector)}
                    className={`${selectedTables.length > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Tables ({selectedTables.length})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select specific tables to display</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Feature Filter - Priority on mobile */}
          <Select value={selectedFeature} onValueChange={handleFeatureChange}>
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
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      id="show-columns"
                      checked={showColumns}
                      onCheckedChange={setShowColumns}
                      className="scale-75 sm:scale-100"
                    />
                    <Label htmlFor="show-columns" className="text-xs sm:text-sm">Fields</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>Show Table Fields:</strong> Display individual columns/fields inside each table card. 
                    Turn off to show only table names for a cleaner overview.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      id="show-relationships"
                      checked={showRelationships}
                      onCheckedChange={setShowRelationships}
                      className="scale-75 sm:scale-100"
                    />
                    <Label htmlFor="show-relationships" className="text-xs sm:text-sm">Lines</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>Show Relationship Lines:</strong> Display connecting lines between related tables. 
                    Turn off to hide all relationship connections for a simpler view.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Simplify Lines toggle - only shown when relationships are visible */}
            {showRelationships && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Switch
                        id="simplify-lines"
                        checked={simplifyLines}
                        onCheckedChange={setSimplifyLines}
                        className="scale-75 sm:scale-100"
                      />
                      <Label htmlFor="simplify-lines" className="text-xs sm:text-sm">Straight Lines</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Straight Lines Mode:</strong> Shows direct straight-line connections between tables instead of curved/stepped paths. 
                      Reduces visual clutter but may cause line crossings. Turn off for curved relationship paths.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
        
        {/* Show Related Tables Toggle - appears when tables are selected */}
        {selectedTables.length > 0 && !isFullScreen && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600">Selected: {selectedTables.length} tables</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Switch
                        id="show-related"
                        checked={showRelatedTables}
                        onCheckedChange={setShowRelatedTables}
                        className="scale-75 sm:scale-100"
                      />
                      <Label htmlFor="show-related" className="text-xs sm:text-sm">Include Related</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Include Related Tables:</strong> Also show tables that are connected to your selected tables through foreign key relationships.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-white border rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Select Tables to Display</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTableSelector(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{selectedTables.length} selected</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTables(filteredTables.map(t => t.name))}
                    disabled={selectedTables.length === filteredTables.length}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTables([])}
                    disabled={selectedTables.length === 0}
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    None
                  </Button>
                </div>
              </div>
              {/* Search within table selector */}
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter tables..."
                  value={tableSelectorSearch}
                  onChange={(e) => setTableSelectorSearch(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTables
                .filter(table => 
                  tableSelectorSearch === "" || 
                  table.name.toLowerCase().includes(tableSelectorSearch.toLowerCase()) ||
                  table.category.toLowerCase().includes(tableSelectorSearch.toLowerCase())
                )
                .map((table) => (
                <div
                  key={table.name}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => {
                    if (selectedTables.includes(table.name)) {
                      setSelectedTables(prev => prev.filter(t => t !== table.name));
                    } else {
                      setSelectedTables(prev => [...prev, table.name]);
                    }
                  }}
                >
                  {selectedTables.includes(table.name) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{table.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {table.columns.length} columns • {table.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schema Diagram */}
      <div className={`${isFullScreen ? 'h-screen' : 'flex-1'} relative`}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleTableClick}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls />
          
          {/* Full Screen Exit Button - Only visible in full screen mode */}
          {isFullScreen && (
            <Panel position="top-left" className="z-50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsFullScreen(false)}
                      className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                    >
                      <Minimize className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exit full screen mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Panel>
          )}

          {/* Custom Control Buttons */}
          <Panel position="top-right" className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fitView({ 
                      padding: 0.15, 
                      duration: 800,
                      includeHiddenNodes: false,
                      minZoom: 0.1,
                      maxZoom: 1.5
                    })}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fit all visible tables in view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Reset all view settings to show everything
                      setShowRelationships(true);
                      setFocusMode(false);
                      setFocusTable(null);
                      setSelectedFeature('');
                      setSelectedCategory('');
                      setSearchTerm('');
                      // Fit view after reset
                      setTimeout(() => {
                        fitView({ 
                          padding: 0.15, 
                          duration: 800,
                          includeHiddenNodes: false,
                          minZoom: 0.1,
                          maxZoom: 1.5
                        });
                      }, 100);
                    }}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all filters and show all tables with relationships</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMiniMap(!showMiniMap)}
                    className={`bg-white/90 backdrop-blur-sm hover:bg-white ${showMiniMap ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    {showMiniMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showMiniMap ? 'Hide' : 'Show'} view finder (minimap)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={`bg-white/90 backdrop-blur-sm hover:bg-white ${isFullScreen ? 'ring-2 ring-green-200' : ''}`}
                  >
                    {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullScreen ? 'Exit' : 'Enter'} full screen mode (F11 or Esc)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Panel>
          
          {showMiniMap && (
            <MiniMap 
              nodeStrokeColor={(n) => getCategoryColor(n.data?.table?.category || 'default')}
              nodeColor={(n) => getCategoryColor(n.data?.table?.category || 'default')}
              nodeBorderRadius={2}
              className="!w-32 !h-24 sm:!w-48 sm:!h-32"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
          )}
          
          {showLegend && (
            <Panel position="bottom-right">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Legend
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLegend(false)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Close Legend"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </Button>
                  </div>
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
                    <h4 className="font-medium">Relationships:</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold text-lg" style={{ fontFamily: 'monospace' }}>1</span>
                      <span className="text-xs">One side (parent)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold text-lg" style={{ fontFamily: 'monospace' }}>∞</span>
                      <span className="text-xs">Many side (children)</span>
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
          )}
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