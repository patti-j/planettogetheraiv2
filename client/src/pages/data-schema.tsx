import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from 'wouter';
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
  EdgeTypes,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
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
import { Slider } from "@/components/ui/slider";
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
  Home,
  Minus,
  RefreshCw,
  Flag,
  Zap,
  Lasso,
  MousePointer,
  Focus
} from "lucide-react";

// Custom edge component for relationships with cardinality labels and tooltips
const CardinalityEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  markerStart,
}: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const sourceLabel = data?.sourceLabel;
  const targetLabel = data?.targetLabel;

  // Calculate label positions - closer to endpoints
  const sourceX_pos = sourceX + (targetX - sourceX) * 0.05;
  const sourceY_pos = sourceY + (targetY - sourceY) * 0.05;
  const targetX_pos = sourceX + (targetX - sourceX) * 0.95;
  const targetY_pos = sourceY + (targetY - sourceY) * 0.95;

  // Calculate tooltip position at the center of the edge
  const centerX = sourceX + (targetX - sourceX) * 0.5;
  const centerY = sourceY + (targetY - sourceY) * 0.5;

  const handleMouseEnter = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    setTooltipPosition({ 
      x: centerX,
      y: centerY - 40 // Position tooltip above the line
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        markerStart={markerStart} 
        style={{
          ...style,
          strokeWidth: (style.strokeWidth || 3) + 2, // Make slightly thicker for easier hovering
          cursor: 'pointer',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Relationship information tooltip */}
      {showTooltip && data?.relationshipInfo && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${tooltipPosition.x}px,${tooltipPosition.y}px)`,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'normal',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 2000,
              pointerEvents: 'none',
              maxWidth: '280px',
              whiteSpace: 'nowrap',
            }}
          >
            <div className="text-center">
              <div className="font-medium mb-1">
                {data.relationshipInfo.fromTable}.{data.relationshipInfo.fromColumn}
              </div>
              <div className="text-gray-300 text-xs mb-1">
                {data.relationshipInfo.type.replace('-', ' ')}
              </div>
              <div className="font-medium">
                {data.relationshipInfo.toTable}.{data.relationshipInfo.toColumn}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {data?.showCardinality && (
        <EdgeLabelRenderer>
          {sourceLabel && (
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${sourceX_pos}px,${sourceY_pos}px)`,
                fontSize: '20px',
                fontWeight: 'bold',
                color: sourceLabel === '1' ? '#059669' : '#dc2626',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: `2px solid ${sourceLabel === '1' ? '#059669' : '#dc2626'}`,
                fontFamily: 'monospace',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              {sourceLabel}
            </div>
          )}
          {targetLabel && (
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${targetX_pos}px,${targetY_pos}px)`,
                fontSize: '20px',
                fontWeight: 'bold',
                color: targetLabel === '1' ? '#059669' : '#dc2626',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: `2px solid ${targetLabel === '1' ? '#059669' : '#dc2626'}`,
                fontFamily: 'monospace',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              {targetLabel}
            </div>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// Custom edge component for regular edges with tooltips
const TooltipEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  markerStart,
}: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Calculate tooltip position at the center of the edge
  const centerX = sourceX + (targetX - sourceX) * 0.5;
  const centerY = sourceY + (targetY - sourceY) * 0.5;

  const handleMouseEnter = () => {
    setTooltipPosition({ 
      x: centerX,
      y: centerY - 40 // Position tooltip above the line
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        markerStart={markerStart} 
        style={{
          ...style,
          strokeWidth: (style.strokeWidth || 3) + 2, // Make slightly thicker for easier hovering
          cursor: 'pointer',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Relationship information tooltip */}
      {showTooltip && data?.relationshipInfo && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${tooltipPosition.x}px,${tooltipPosition.y}px)`,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'normal',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 2000,
              pointerEvents: 'none',
              maxWidth: '280px',
              whiteSpace: 'nowrap',
            }}
          >
            <div className="text-center">
              <div className="font-medium mb-1">
                {data.relationshipInfo.fromTable}.{data.relationshipInfo.fromColumn}
              </div>
              <div className="text-gray-300 text-xs mb-1">
                {data.relationshipInfo.type.replace('-', ' ')}
              </div>
              <div className="font-medium">
                {data.relationshipInfo.toTable}.{data.relationshipInfo.toColumn}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const edgeTypes: EdgeTypes = {
  cardinality: CardinalityEdge,
  'default': TooltipEdge,
  'straight': TooltipEdge,
  'step': TooltipEdge,
  'bezier': TooltipEdge,
  'smoothstep': TooltipEdge,
};

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
  comment?: string;
}

interface SchemaRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  description?: string;
}

// Custom node component for database tables
const TableNode = ({ data }: { data: any }) => {
  const { table, showColumns, showRelationships, isFocused, isConnected, isSelected, onSelect, onClick } = data;
  
  const getCardClassName = () => {
    let baseClasses = "min-w-[280px] max-w-[380px] shadow-lg border-2 transition-all duration-200";
    
    if (isFocused) {
      return `${baseClasses} ring-4 ring-blue-500 ring-opacity-50 border-blue-500 scale-105`;
    } else if (isSelected) {
      return `${baseClasses} ring-2 ring-green-500 ring-opacity-50 border-green-500 bg-green-50/30`;
    } else if (isConnected) {
      return `${baseClasses} border-blue-300 bg-blue-50/30`;
    } else {
      return baseClasses;
    }
  };

  const getCardStyle = () => {
    if (isFocused || isConnected) {
      return { borderColor: '#3b82f6' };
    } else if (isSelected) {
      return { borderColor: '#10b981' };
    } else {
      return { borderColor: getCategoryColor(table.category) };
    }
  };

  return (
    <Card 
      className={getCardClassName()} 
      style={{...getCardStyle(), minWidth: '250px'}}
      onClick={() => onClick?.(table.name)}
    >
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-start gap-2 text-sm pr-8 leading-tight">
          <Table className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="break-words hyphens-auto leading-tight font-medium overflow-hidden">{table.name}</span>
        </CardTitle>
        
        {/* Positioned controls container to prevent overflow */}
        <div className="absolute top-1 right-1 flex flex-col items-end gap-1">
          {(isFocused || isSelected) && (
            <div className="flex gap-1">
              {isFocused && <Badge variant="default" className="text-[10px] px-1 py-0 bg-blue-500 text-white">FOCUS</Badge>}
              {isSelected && <Badge variant="default" className="text-[10px] px-1 py-0 bg-green-500 text-white">SELECTED</Badge>}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`h-5 w-5 p-0 flex-shrink-0 ${isSelected ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(table.name);
            }}
          >
            <Flag className={`w-3 h-3 ${isSelected ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        {/* Category badge positioned below title */}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {table.category}
          </Badge>
        </div>
        
        {table.description && (
          <p className="text-xs text-gray-600 mt-1">{table.description}</p>
        )}
      </CardHeader>
      {showColumns && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {table.columns.slice(0, 10).map((column: SchemaColumn, idx: number) => (
              <div key={idx} className="pb-2 border-b border-gray-100 last:border-0">
                <div className="flex items-start flex-wrap gap-1 text-xs">
                  <div className="flex items-center gap-1 min-w-0">
                    {column.primaryKey && <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                    {column.foreignKey && <Link2 className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                    <span className={`${column.primaryKey ? "font-bold" : ""} break-words`}>{column.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1 py-0 ml-auto">
                    {column.type}
                  </Badge>
                  {!column.nullable && <span className="text-red-500 ml-1">*</span>}
                </div>
                {column.comment && (
                  <div className="mt-1 pl-4 text-xs text-gray-500 italic leading-relaxed break-words max-w-full">
                    {column.comment}
                  </div>
                )}
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
    // Core inventory tracking
    'stocks', 'storage_locations',
    // Material requirements 
    'material_requirements',
    // Purchase management
    'purchase_orders', 'purchase_order_lines',
    // Sales management
    'sales_orders', 'sales_order_lines', 'sales_order_line_distributions',
    // Transfer management
    'transfer_orders', // transfer_order_lines: DELETED - replaced by pttransferorderdistributions
    // Demand and forecasting
    'demand_forecasts', 'demand_history', 'demand_drivers',
    // Product outputs affecting inventory
    'bom_product_outputs', 'recipe_product_outputs'
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
    'pt_publish_master_production_schedule', 'sales_orders', 'planned_orders', 'mrp_runs',
    'demand_planning_scenarios', 'capacity_planning'
  ],
  'maintenance': [
    'resources', 'maintenance_schedules', 'maintenance_work_orders', 'maintenance_tasks',
    'preventive_maintenance', 'equipment_history', 'spare_parts', 'maintenance_costs',
    'downtime_records', 'resource_downtime'
  ],
  'sales': [
    'sales_orders', 'sales_order_lines', 'sales_order_line_distributions', 'customers', 'customer_contacts', 'sales_order_items',
    'delivery_schedules', 'customer_forecasts', 'price_lists', 'sales_contracts',
    'order_confirmations', 'shipping_notices'
  ],
  'purchasing': [
    'purchase_orders', 'purchase_order_lines', 'suppliers', 'supplier_contacts', 'purchase_requisitions',
    'goods_receipts', 'supplier_evaluations', 'contracts', 'purchase_agreements',
    'vendor_managed_inventory', 'supplier_schedules'
  ],
  'finance': [
    'cost_centers', 'cost_allocations', 'budgets', 'actual_costs', 'variance_analysis',
    'financial_periods', 'exchange_rates', 'price_changes', 'cost_rollups',
    'profitability_analysis'
  ],
  'discrete_production': [
    // Discrete Manufacturing (BOM + Routing based)
    'bills_of_material', 'bom_items', 'bom_material_requirements', 'bom_product_outputs',
    'routings', 'routing_operations', 'discrete_operations', 'discrete_operation_phases',
    // Production control for discrete manufacturing
    'production_orders', 'production_versions', 'planned_orders',
    // Resources and infrastructure
    'work_centers', 'resources', 'resource_capabilities', 'capabilities', 'resource_requirements',
    // Material Requirements (BOM-based for discrete manufacturing)
    'material_requirements',
    // Products and items
    'items', 'products', 'product_structures', 'product_categories',
    // Planning and scheduling
    'shift_templates', 'resource_shift_assignments',
    // Quality for discrete
    'quality_inspections', 'quality_specifications'
  ],
  'process_production': [
    // Process Manufacturing (Recipe-based)
    'recipes', 'recipe_operations', 'recipe_phases', 'recipe_operation_relationships', 
    'recipe_material_assignments', 'recipe_formulas', 'recipe_product_outputs', 'process_operations',
    // Ingredients and materials for process manufacturing
    'ingredients', 'material_requirements',
    // Production control for process manufacturing
    'production_orders', 'production_versions', 'planned_orders',
    // Resources and infrastructure
    'work_centers', 'resources', 'resource_capabilities', 'capabilities', 'resource_requirements',
    // Plants and storage for process manufacturing
    'plants', 'storage_locations',
    // Quality for process manufacturing
    'quality_inspections', 'quality_specifications', 'process_parameters',
    // Batch and lot tracking
    'production_lots', 'batch_records'
  ],
  'engineering': [
    // Process Manufacturing (Recipe-based)
    'recipes', 'recipe_operations', 'recipe_phases', 'recipe_operation_relationships', 'recipe_material_assignments', 'recipe_formulas', 'recipe_product_outputs',
    'ingredients', 'material_requirements', 'process_operations',
    // Discrete Manufacturing (BOM-based)
    'bills_of_materials', 'bom_items', 'bom_material_requirements', 'bom_product_outputs',
    'routings', 'routing_operations', 'discrete_operations',
    // Production Versions (links BOMs/recipes to plants)
    'production_versions',
    // Core Engineering Infrastructure
    'work_centers', 'resources', 'plants', 'capabilities', 'resource_capabilities', 'resource_requirements', 'storage_locations',
    // Product & Technical Data
    'product_masters', 'products', 'product_categories', 'product_structures', 'items',
    'engineering_changes', 'specifications', 'documents', 'alternate_routings', 'operations',
    'quality_specifications', 'material_specifications', 'process_parameters', 'technical_documents'
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
  { value: 'discrete_production', label: 'Discrete Production (BOM + Routing)' },
  { value: 'process_production', label: 'Process Production (Recipe-based)' },
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

// Helper function to analyze relationship clusters for intelligent positioning
const analyzeRelationshipClusters = (tables: SchemaTable[]) => {
  const clusters: { [key: string]: string[] } = {};
  const tableConnections: { [key: string]: Set<string> } = {};
  
  // Initialize connection tracking
  tables.forEach(table => {
    tableConnections[table.name] = new Set();
  });
  
  // Map all relationships
  tables.forEach(table => {
    table.relationships.forEach(rel => {
      if (tables.some(t => t.name === rel.toTable)) {
        tableConnections[table.name].add(rel.toTable);
        tableConnections[rel.toTable]?.add(table.name);
      }
    });
  });
  
  // Find highly connected tables as cluster centers
  const connectionCounts = Object.entries(tableConnections).map(([name, connections]) => ({
    name,
    count: connections.size
  })).sort((a, b) => b.count - a.count);
  
  return { tableConnections, connectionCounts };
};

// Force-directed layout algorithm for relationship-aware positioning
const forceDirectedLayout = (tables: SchemaTable[], iterations: number = 100) => {
  const positions: { [key: string]: { x: number; y: number } } = {};
  const { tableConnections } = analyzeRelationshipClusters(tables);
  
  // Enhanced initial positioning with better screen utilization
  const layoutWidth = Math.max(1600, tables.length * 300);
  const layoutHeight = Math.max(1200, tables.length * 250);
  
  // Create initial grid-like distribution instead of random
  const gridCols = Math.ceil(Math.sqrt(tables.length * 1.3));
  const gridRows = Math.ceil(tables.length / gridCols);
  const spacingX = layoutWidth * 0.85 / Math.max(1, gridCols - 1);
  const spacingY = layoutHeight * 0.85 / Math.max(1, gridRows - 1);
  const startX = layoutWidth * 0.075; // 7.5% margin
  const startY = layoutHeight * 0.075; // 7.5% margin
  
  tables.forEach((table, index) => {
    const row = Math.floor(index / gridCols);
    const col = index % gridCols;
    
    // Add controlled jitter for natural positioning
    const jitterX = (Math.random() - 0.5) * spacingX * 0.2;
    const jitterY = (Math.random() - 0.5) * spacingY * 0.2;
    
    positions[table.name] = {
      x: startX + col * spacingX + jitterX,
      y: startY + row * spacingY + jitterY
    };
  });
  
  // Force-directed positioning
  for (let iter = 0; iter < iterations; iter++) {
    const forces: { [key: string]: { x: number; y: number } } = {};
    
    // Initialize forces
    tables.forEach(table => {
      forces[table.name] = { x: 0, y: 0 };
    });
    
    // Repulsive forces (prevent overlapping)
    tables.forEach(table1 => {
      tables.forEach(table2 => {
        if (table1.name !== table2.name) {
          const pos1 = positions[table1.name];
          const pos2 = positions[table2.name];
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 50);
          const repulsiveForce = 8000 / (distance * distance);
          
          forces[table1.name].x += (dx / distance) * repulsiveForce;
          forces[table1.name].y += (dy / distance) * repulsiveForce;
        }
      });
    });
    
    // Attractive forces (related tables pull toward each other)
    tables.forEach(table => {
      const connections = tableConnections[table.name];
      connections.forEach(connectedTable => {
        if (positions[connectedTable]) {
          const pos1 = positions[table.name];
          const pos2 = positions[connectedTable];
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const attractiveForce = distance * 0.01;
          
          forces[table.name].x += (dx / distance) * attractiveForce;
          forces[table.name].y += (dy / distance) * attractiveForce;
        }
      });
    });
    
    // Apply forces with damping
    const damping = 0.9;
    tables.forEach(table => {
      positions[table.name].x += forces[table.name].x * 0.1 * damping;
      positions[table.name].y += forces[table.name].y * 0.1 * damping;
      
      // Keep within enhanced layout bounds
      positions[table.name].x = Math.max(50, Math.min(layoutWidth - 50, positions[table.name].x));
      positions[table.name].y = Math.max(50, Math.min(layoutHeight - 50, positions[table.name].y));
    });
  }
  
  return positions;
};

// Layout algorithms with improved collision detection and relationship-aware spacing
const layoutAlgorithms = {
  hierarchical: (tables: SchemaTable[]) => {
    const { tableConnections, connectionCounts } = analyzeRelationshipClusters(tables);
    const positions: { [key: string]: { x: number; y: number } } = {};
    const existingPositions: { x: number; y: number }[] = [];
    
    // Start with force-directed layout for relationship awareness
    const forcePositions = forceDirectedLayout(tables, 50);
    
    // Then organize by categories with relationship-aware grouping
    const categories = Array.from(new Set(tables.map(t => t.category)));
    const minCardWidth = 320;
    const minCardHeight = 200;
    const padding = 60;
    
    let currentY = 0;
    
    categories.forEach((category, categoryIndex) => {
      const categoryTables = tables.filter(t => t.category === category);
      
      // Sort tables within category by connection count (most connected first)
      categoryTables.sort((a, b) => {
        const aConnections = tableConnections[a.name]?.size || 0;
        const bConnections = tableConnections[b.name]?.size || 0;
        return bConnections - aConnections;
      });
      
      // Calculate optimal columns based on table count and relationship density
      const avgConnections = categoryTables.reduce((sum, t) => sum + (tableConnections[t.name]?.size || 0), 0) / categoryTables.length;
      const maxCols = avgConnections > 3 ? 4 : Math.max(2, Math.min(5, Math.ceil(Math.sqrt(categoryTables.length * 1.5))));
      const cols = Math.min(maxCols, categoryTables.length);
      
      const horizontalSpacing = minCardWidth + padding;
      
      categoryTables.forEach((table, tableIndex) => {
        const row = Math.floor(tableIndex / cols);
        const col = tableIndex % cols;
        
        const estimatedHeight = minCardHeight + (table.columns.length > 10 ? 60 : table.columns.length * 6);
        
        // Use force-directed position as base, then adjust for grid structure
        const forcePos = forcePositions[table.name];
        const gridPos = {
          x: col * horizontalSpacing,
          y: currentY + row * (estimatedHeight + padding)
        };
        
        // Blend force-directed and grid positions (favor grid for organization)
        const proposedPosition = {
          x: gridPos.x + (forcePos.x - gridPos.x) * 0.2,
          y: gridPos.y + (forcePos.y - gridPos.y) * 0.2
        };
        
        const finalPosition = resolveCollision(proposedPosition, existingPositions, minCardWidth, estimatedHeight);
        positions[table.name] = finalPosition;
        existingPositions.push(finalPosition);
      });
      
      const categoryRows = Math.ceil(categoryTables.length / cols);
      const maxEstimatedHeight = Math.max(...categoryTables.map(t => 
        minCardHeight + (t.columns.length > 10 ? 60 : t.columns.length * 6)
      ));
      currentY += categoryRows * (maxEstimatedHeight + padding) + 100;
    });
    
    return positions;
  },
  
  circular: (tables: SchemaTable[]) => {
    const { tableConnections, connectionCounts } = analyzeRelationshipClusters(tables);
    const positions: { [key: string]: { x: number; y: number } } = {};
    const existingPositions: { x: number; y: number }[] = [];
    const centerX = 600;
    const centerY = 400;
    
    // Dynamic radius based on table count and relationship density
    const minRadius = 350;
    const cardWidth = 320;
    const cardHeight = 200;
    
    // Calculate radius considering relationships
    const arcLength = cardWidth + 80;
    const minRadiusForSpacing = (tables.length * arcLength) / (2 * Math.PI);
    const calculatedRadius = Math.max(minRadius, minRadiusForSpacing);
    
    // Sort tables by connection count (most connected in optimal positions)
    const sortedTables = [...tables].sort((a, b) => {
      const aConnections = tableConnections[a.name]?.size || 0;
      const bConnections = tableConnections[b.name]?.size || 0;
      return bConnections - aConnections;
    });
    
    // Use force-directed positioning as base
    const forcePositions = forceDirectedLayout(tables, 30);
    
    sortedTables.forEach((table, index) => {
      const angle = (index / tables.length) * 2 * Math.PI;
      const circularPos = {
        x: centerX + calculatedRadius * Math.cos(angle),
        y: centerY + calculatedRadius * Math.sin(angle)
      };
      
      // Blend circular and force-directed positions
      const forcePos = forcePositions[table.name];
      const proposedPosition = {
        x: circularPos.x * 0.7 + forcePos.x * 0.3,
        y: circularPos.y * 0.7 + forcePos.y * 0.3
      };
      
      const finalPosition = resolveCollision(proposedPosition, existingPositions, cardWidth, cardHeight);
      positions[table.name] = finalPosition;
      existingPositions.push(finalPosition);
    });
    
    return positions;
  },
  
  grid: (tables: SchemaTable[]) => {
    const { tableConnections, connectionCounts } = analyzeRelationshipClusters(tables);
    const positions: { [key: string]: { x: number; y: number } } = {};
    const existingPositions: { x: number; y: number }[] = [];
    
    const minCardWidth = 320;
    const minCardHeight = 200;
    const padding = 60;
    
    // Calculate optimal grid dimensions based on relationships
    const avgConnections = tables.reduce((sum, t) => sum + (tableConnections[t.name]?.size || 0), 0) / tables.length;
    const aspectRatio = avgConnections > 2 ? 4/3 : 16/9; // More square layout for highly connected tables
    let cols = Math.ceil(Math.sqrt(tables.length * aspectRatio));
    cols = Math.max(2, Math.min(6, cols));
    
    // Sort tables by connection count and category
    const sortedTables = [...tables].sort((a, b) => {
      // Primary sort: category for grouping
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // Secondary sort: connection count (most connected first within category)
      const aConnections = tableConnections[a.name]?.size || 0;
      const bConnections = tableConnections[b.name]?.size || 0;
      return bConnections - aConnections;
    });
    
    // Use force-directed layout as base for relationship awareness
    const forcePositions = forceDirectedLayout(tables, 40);
    const horizontalSpacing = minCardWidth + padding;
    
    sortedTables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const estimatedHeight = minCardHeight + (table.columns.length > 10 ? 60 : table.columns.length * 6);
      const verticalSpacing = estimatedHeight + padding;
      
      const gridPos = {
        x: col * horizontalSpacing,
        y: row * verticalSpacing
      };
      
      // Blend grid and force-directed positions (favor grid structure)
      const forcePos = forcePositions[table.name];
      const proposedPosition = {
        x: gridPos.x + (forcePos.x - gridPos.x) * 0.15,
        y: gridPos.y + (forcePos.y - gridPos.y) * 0.15
      };
      
      const finalPosition = resolveCollision(proposedPosition, existingPositions, minCardWidth, estimatedHeight);
      positions[table.name] = finalPosition;
      existingPositions.push(finalPosition);
    });
    
    return positions;
  }
};

function DataSchemaViewContent() {
  // Get navigation function
  const [, setLocation] = useLocation();
  
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
  const [clickedTable, setClickedTable] = useState<string | null>(null);
  const [focusTable, setFocusTable] = useState<string | null>(null);
  
  // Handle table card clicks for relationship highlighting
  const handleTableClick = useCallback((tableName: string) => {
    if (clickedTable === tableName) {
      // If clicking the same table, clear the click highlight
      setClickedTable(null);
    } else {
      // Highlight relationships for the clicked table
      setClickedTable(tableName);
    }
  }, [clickedTable]);
  
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
  
  // Card-based selection for relationship filtering - separate from table selector
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  // Lasso selection states
  const [isLassoMode, setIsLassoMode] = useState(false);
  const [lassoPath, setLassoPath] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoSelection, setLassoSelection] = useState<string[]>([]);
  const [zoomedToLasso, setZoomedToLasso] = useState(false);
  
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
  const { fitView, zoomIn, zoomOut, zoomTo, getZoom } = useReactFlow();
  
  // Manual refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Manual zoom control state
  const [zoomLevel, setZoomLevel] = useState([1]); // Initial zoom level 100%
  
  // Handle manual zoom slider changes
  const handleZoomChange = (newZoom: number[]) => {
    const zoom = newZoom[0];
    setZoomLevel(newZoom);
    zoomTo(zoom, { duration: 200 });
  };
  
  // Update zoom level when ReactFlow zoom changes (from mouse wheel, etc.)
  useEffect(() => {
    try {
      const currentZoom = getZoom();
      if (Math.abs(currentZoom - zoomLevel[0]) > 0.01) {
        setZoomLevel([currentZoom]);
      }
    } catch (error) {
      // Ignore errors during initial setup
    }
  }, [getZoom, zoomLevel]);
  
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
  const { data: schemaData, isLoading, error } = useQuery<SchemaTable[]>({
    queryKey: ['/api/database/schema'],
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

  // Lasso selection helper functions
  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]) => {
    if (polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if ((polygon[i].y > point.y) !== (polygon[j].y > point.y) &&
          point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x) {
        inside = !inside;
      }
    }
    return inside;
  };

  const getTablePosition = (tableName: string, currentNodes: any[]) => {
    const node = currentNodes.find(n => n.id === tableName);
    return node ? { x: node.position.x, y: node.position.y } : null;
  };

  const selectTablesInLasso = useCallback((currentNodes: any[]) => {
    if (lassoPath.length < 3) return;
    
    const selectedInLasso: string[] = [];
    
    console.log('Selecting tables in lasso:', {
      lassoPathLength: lassoPath.length,
      nodesCount: currentNodes.length,
      sampleLassoPoint: lassoPath[0],
      sampleNode: currentNodes[0] ? {
        id: currentNodes[0].id,
        position: currentNodes[0].position
      } : null
    });
    
    currentNodes.forEach(node => {
      const nodeCenter = {
        x: node.position.x + 150, // Approximate center of table node
        y: node.position.y + 100
      };
      
      if (isPointInPolygon(nodeCenter, lassoPath)) {
        selectedInLasso.push(node.id);
        console.log(`Table ${node.id} selected in lasso at position:`, nodeCenter);
      }
    });
    
    console.log('Final lasso selection result:', selectedInLasso);
    
    setLassoSelection(selectedInLasso);
    setSelectedTables(selectedInLasso);
    
    // Show toast with selection count
    toast({
      title: "Lasso Selection Complete",
      description: `Selected ${selectedInLasso.length} tables`,
    });
  }, [lassoPath, setSelectedTables, toast]);

  const handleLassoMouseDown = (event: React.MouseEvent) => {
    if (!isLassoMode) return;
    
    event.preventDefault();
    setIsDrawing(true);
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    setLassoPath([position]);
  };

  const handleLassoMouseMove = (event: React.MouseEvent) => {
    if (!isLassoMode || !isDrawing) return;
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    
    setLassoPath(prev => [...prev, position]);
  };

  const handleLassoMouseUp = (currentNodes: any[]) => {
    if (!isLassoMode || !isDrawing) return;
    
    setIsDrawing(false);
    selectTablesInLasso(currentNodes);
    setLassoPath([]);
  };

  const zoomToLassoSelection = useCallback((currentNodes: any[]) => {
    if (lassoSelection.length === 0) return;
    
    const selectedNodes = currentNodes.filter(node => lassoSelection.includes(node.id));
    if (selectedNodes.length === 0) return;
    
    // Calculate bounding box of selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 300); // Approximate node width
      maxY = Math.max(maxY, node.position.y + 200); // Approximate node height
    });
    
    // Add padding
    const padding = 50;
    const boundingBox = {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding
    };
    
    console.log('Zooming to lasso selection:', {
      selectedCount: selectedNodes.length,
      boundingBox,
      selectedNodeIds: selectedNodes.map(n => n.id)
    });
    
    // Use fitBounds for more precise control
    try {
      fitView({ 
        nodes: selectedNodes,
        padding: 0.1,
        duration: 1000,
        minZoom: 0.1,
        maxZoom: 1.5
      });
      
      setZoomedToLasso(true);
      
      toast({
        title: "Zoomed to Selection",
        description: `Focused on ${lassoSelection.length} selected tables`,
      });
    } catch (error) {
      console.error('Error zooming to selection:', error);
      toast({
        title: "Zoom Error",
        description: "Could not zoom to selection",
        variant: "destructive"
      });
    }
  }, [lassoSelection, fitView, toast]);

  const resetLassoZoom = () => {
    setZoomedToLasso(false);
    setLassoSelection([]);
    setSelectedTables([]);
    fitView({ duration: 800 });
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
      const connectedTableNames = getConnectedTables(focusTable, schemaData as SchemaTable[]);
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

  // Handler for card selection via flag icon - create stable reference for useMemo
  const handleCardSelection = useCallback((tableName: string) => {
    setSelectedCards(prev => {
      const newSelection = prev.includes(tableName) 
        ? prev.filter(name => name !== tableName)
        : [...prev, tableName];
      
      return newSelection;
    });
  }, []);

  // State for storing custom positions per filter
  const [customPositions, setCustomPositions] = useState<Record<string, Record<string, { x: number; y: number }>>>(() => {
    try {
      const saved = localStorage.getItem('dataSchemaCustomPositions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track if positions have been restored for current filter to prevent overriding user changes
  const [positionsRestored, setPositionsRestored] = useState(true);

  // Generate layout positions (separate from selection state to prevent recalculation on flag clicks)
  const tablePositions = useMemo(() => {
    if (!filteredTables.length) return {};
    
    // Create filter key based on current filter settings
    const filterKey = `${selectedFeature}-${selectedCategory}-${layoutType}-${selectedTables.join(',')}-${showRelatedTables}`;
    
    // Check if we have saved positions for this filter
    const savedPositions = customPositions[filterKey];
    if (savedPositions && Object.keys(savedPositions).length > 0 && positionsRestored) {
      // Use saved positions for tables that exist, fallback to algorithm for new tables
      const algorithmPositions = layoutAlgorithms[layoutType](filteredTables);
      const positions: Record<string, { x: number; y: number }> = {};
      
      filteredTables.forEach(table => {
        positions[table.name] = savedPositions[table.name] || algorithmPositions[table.name] || { x: 0, y: 0 };
      });
      
      return positions;
    }
    
    // Use algorithm-generated positions
    return layoutAlgorithms[layoutType](filteredTables);
  }, [filteredTables, layoutType, selectedFeature, selectedCategory, selectedTables, showRelatedTables, customPositions, positionsRestored]);

  // Generate nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    if (!filteredTables.length) return { nodes: [], edges: [] };
    
    // Get connected tables if in focus mode
    const connectedTableNames = focusMode && focusTable && schemaData 
      ? getConnectedTables(focusTable, schemaData as SchemaTable[]) 
      : [];
    
    const flowNodes: Node[] = filteredTables.map(table => {
      const isFocused = focusMode && table.name === focusTable;
      const isConnected = focusMode && focusTable && connectedTableNames.includes(table.name) && table.name !== focusTable;
      const isSelected = selectedCards.includes(table.name);
      
      return {
        id: table.name,
        type: 'default',
        position: tablePositions[table.name] || { x: 0, y: 0 },
        data: { 
          table, 
          showColumns, 
          showRelationships,
          isFocused,
          isConnected,
          isSelected,
          onSelect: handleCardSelection,
          onClick: handleTableClick,
          label: <TableNode data={{ table, showColumns, showRelationships, isFocused, isConnected, isSelected, onSelect: handleCardSelection, onClick: handleTableClick }} />
        },
        style: {
          background: 'transparent',
          border: 'none',
        }
      };
    });

    const flowEdges: Edge[] = [];
    const processedRelationships = new Set<string>();
    
    if (showRelationships) {
      filteredTables.forEach(table => {
        table.relationships.forEach(rel => {
          // Ensure both source and target tables exist in the filtered set
          if (filteredTables.some(t => t.name === rel.toTable) && 
              filteredTables.some(t => t.name === rel.fromTable)) {
            // Create a unique identifier for this relationship that ignores direction
            // This prevents duplicate lines for bidirectional relationships
            const relationshipKey = [rel.fromTable, rel.toTable].sort().join('-') + '-' + [rel.fromColumn, rel.toColumn].sort().join('-');
            
            // Skip if we've already processed this relationship
            if (processedRelationships.has(relationshipKey)) {
              return;
            }
            processedRelationships.add(relationshipKey);
            
            // If cards are selected, only show relationships between selected cards
            if (selectedCards.length > 0) {
              if (!selectedCards.includes(rel.fromTable) || !selectedCards.includes(rel.toTable)) {
                return;
              }
            }
            
            const isHighlighted = (focusMode && focusTable && 
              (rel.fromTable === focusTable || rel.toTable === focusTable || 
               (connectedTableNames.includes(rel.fromTable) && connectedTableNames.includes(rel.toTable)))) ||
              (clickedTable && (rel.fromTable === clickedTable || rel.toTable === clickedTable));
            
            // Calculate better edge routing to avoid crossovers
            const sourcePos = tablePositions[rel.fromTable];
            const targetPos = tablePositions[rel.toTable];
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
            const isDashed = rel.type === 'one-to-many' || rel.type === 'many-to-one' || rel.type === 'many-to-many';
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
            } else if (rel.type === 'many-to-one') {
              // From side is "many" (larger crow's foot), to side is "one" (simple arrow)
              markerStart = {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: isHighlighted ? 20 : 16,
                height: isHighlighted ? 20 : 16,
              };
              markerEnd = {
                type: MarkerType.Arrow,
                color: edgeColor,
                width: isHighlighted ? 16 : 12,
                height: isHighlighted ? 16 : 12,
              };
              sourceLabel = '∞';
              targetLabel = '1';
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
              markerEnd: markerEnd,
              data: {
                relationshipInfo: {
                  fromTable: rel.fromTable,
                  fromColumn: rel.fromColumn,
                  toTable: rel.toTable,
                  toColumn: rel.toColumn,
                  type: rel.type
                }
              }
            });

            // Add cardinality labels as edge labels using a single edge
            if (rel.type === 'many-to-many' || rel.type === 'one-to-many' || rel.type === 'many-to-one' || rel.type === 'one-to-one') {
              // Remove the main edge we just added and replace with a single labeled edge
              const mainEdge = flowEdges.pop()!;
              
              // Determine source and target labels
              let sourceCardinalityLabel = '';
              let targetCardinalityLabel = '';
              
              if (rel.type === 'many-to-many') {
                sourceCardinalityLabel = '∞';
                targetCardinalityLabel = '∞';
              } else if (rel.type === 'one-to-many') {
                sourceCardinalityLabel = '1';
                targetCardinalityLabel = '∞';
              } else if (rel.type === 'many-to-one') {
                sourceCardinalityLabel = '∞';
                targetCardinalityLabel = '1';
              } else if (rel.type === 'one-to-one') {
                sourceCardinalityLabel = '1';
                targetCardinalityLabel = '1';
              }
              
              // Create the main relationship line with positioned cardinality labels using custom edge
              flowEdges.push({
                ...mainEdge,
                type: 'cardinality',
                // Add custom edge data for rendering cardinality markers and tooltip info
                data: {
                  sourceLabel: sourceCardinalityLabel,
                  targetLabel: targetCardinalityLabel,
                  showCardinality: true,
                  relationshipInfo: {
                    fromTable: rel.fromTable,
                    fromColumn: rel.fromColumn,
                    toTable: rel.toTable,
                    toColumn: rel.toColumn,
                    type: rel.type
                  }
                }
              });
            }
          }
        });
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [filteredTables, layoutType, showColumns, showRelationships, focusMode, focusTable, schemaData, getConnectedTables, simplifyLines, selectedCards, clickedTable]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Vector2D utility for force-directed calculations
  interface Vector2D {
    x: number;
    y: number;
    length: number;
    add: (v: Vector2D) => Vector2D;
    subtract: (v: Vector2D) => Vector2D;
    divide: (n: number) => Vector2D;
    multiply: (n: number) => Vector2D;
    normalize: () => Vector2D;
  }

  const createVector = (x: number, y: number): Vector2D => {
    const length = Math.sqrt(x * x + y * y);
    return {
      x,
      y,
      length,
      add: function(v: Vector2D) { return createVector(this.x + v.x, this.y + v.y); },
      subtract: function(v: Vector2D) { return createVector(this.x - v.x, this.y - v.y); },
      divide: function(n: number) { return createVector(this.x / n, this.y / n); },
      multiply: function(n: number) { return createVector(this.x * n, this.y * n); },
      normalize: function() { 
        return this.length === 0 ? createVector(0, 0) : this.divide(this.length); 
      }
    };
  };

  // Content-Aware Force-Directed Layout Algorithm
  const generateForceDirectedLayout = useCallback((tables: SchemaTable[]): Record<string, { x: number; y: number }> => {
    if (!tables.length) return {};
    
    console.log('Content-aware force-directed layout: Processing', tables.length, 'tables');
    
    // Calculate actual card dimensions based on content
    const getCardDimensions = (table: SchemaTable) => {
      const baseWidth = 300;
      const baseHeight = 120; // Header height
      const columnHeight = showColumns ? Math.min(table.columns.length, 10) * 28 : 0; // 28px per column (including comments)
      const commentHeight = showColumns ? table.columns.slice(0, 10).reduce((acc, col) => 
        acc + (col.comment ? 24 : 0), 0) : 0; // Extra height for comments
      
      return {
        width: baseWidth,
        height: baseHeight + columnHeight + commentHeight + 40 // padding
      };
    };
    
    // Calculate card dimensions and total content area
    const cardDimensions: Record<string, { width: number; height: number }> = {};
    let totalCardArea = 0;
    let maxCardWidth = 0;
    let maxCardHeight = 0;
    
    tables.forEach(table => {
      const dims = getCardDimensions(table);
      cardDimensions[table.name] = dims;
      totalCardArea += dims.width * dims.height;
      maxCardWidth = Math.max(maxCardWidth, dims.width);
      maxCardHeight = Math.max(maxCardHeight, dims.height);
    });
    
    // Calculate optimal viewport dimensions based on content
    const targetDensity = 0.35; // 35% of space filled with cards
    const requiredArea = totalCardArea / targetDensity;
    const aspectRatio = 1.4; // Prefer slightly wider layouts
    const W = Math.sqrt(requiredArea * aspectRatio);
    const H = requiredArea / W;
    
    // Ensure minimum viable spacing
    const minW = Math.sqrt(tables.length) * maxCardWidth * 1.8;
    const minH = Math.sqrt(tables.length) * maxCardHeight * 1.8;
    const finalW = Math.max(W, minW);
    const finalH = Math.max(H, minH);
    
    const iterations = Math.min(60, Math.max(40, tables.length * 2));
    
    // Calculate optimal distance (k) based on average card size
    const avgCardWidth = totalCardArea / tables.length / (maxCardHeight || 200);
    const k = avgCardWidth * 1.3; // Spacing based on actual card width
    
    const fa = (x: number): number => (x * x) / k; // Attractive force
    const fr = (x: number): number => (k * k) / Math.max(x, 20); // Repulsive force with minimum distance
    
    console.log('Content-aware FR parameters:', { 
      finalW: finalW.toFixed(0), 
      finalH: finalH.toFixed(0), 
      totalCardArea: totalCardArea.toFixed(0),
      avgCardWidth: avgCardWidth.toFixed(0),
      k: k.toFixed(0),
      iterations,
      targetDensity
    });
    
    // Build relationship graph for attractive forces
    const relationshipGraph: Record<string, string[]> = {};
    tables.forEach(table => {
      relationshipGraph[table.name] = [];
      table.relationships.forEach(rel => {
        if (tables.some(t => t.name === rel.toTable)) {
          relationshipGraph[table.name].push(rel.toTable);
        }
      });
    });
    
    // Initialize positions with better distribution instead of purely random
    const nodePositions: Record<string, Vector2D> = {};
    const displacements: Record<string, Vector2D> = {};
    
    // Create initial grid-like distribution based on content dimensions
    const gridCols = Math.ceil(Math.sqrt(tables.length * 1.3));
    const gridRows = Math.ceil(tables.length / gridCols);
    const gridSpacingX = finalW * 0.85 / gridCols; // Use actual calculated width
    const gridSpacingY = finalH * 0.85 / gridRows; // Use actual calculated height
    const offsetX = -finalW * 0.425; // Center the grid
    const offsetY = -finalH * 0.425; // Center the grid
    
    tables.forEach((table, index) => {
      const row = Math.floor(index / gridCols);
      const col = index % gridCols;
      
      // Add some random jitter to avoid perfect grid
      const jitterX = (Math.random() - 0.5) * gridSpacingX * 0.3;
      const jitterY = (Math.random() - 0.5) * gridSpacingY * 0.3;
      
      nodePositions[table.name] = createVector(
        offsetX + col * gridSpacingX + jitterX,
        offsetY + row * gridSpacingY + jitterY
      );
      displacements[table.name] = createVector(0, 0);
    });
    
    // Temperature system for cooling based on content dimensions
    let t = finalW / 12; // Slower cooling for better convergence
    const dt = t / (iterations + 1);
    
    // Main force-directed algorithm iteration
    for (let i = 1; i <= iterations; i++) {
      // Reset displacements
      tables.forEach(table => {
        displacements[table.name] = createVector(0, 0);
      });
      
      // Calculate repulsive forces between all pairs
      tables.forEach(tableV => {
        tables.forEach(tableU => {
          if (tableU.name !== tableV.name) {
            const delta = nodePositions[tableV.name].subtract(nodePositions[tableU.name]);
            if (delta.length > 0) {
              const repulsiveForce = fr(delta.length);
              const direction = delta.normalize();
              displacements[tableV.name] = displacements[tableV.name].add(
                direction.multiply(repulsiveForce)
              );
            } else {
              // Handle case where nodes are at same position
              const randomDirection = createVector(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
              ).normalize();
              displacements[tableV.name] = displacements[tableV.name].add(
                randomDirection.multiply(fr(1))
              );
            }
          }
        });
      });
      
      // Calculate attractive forces between connected nodes
      tables.forEach(table => {
        relationshipGraph[table.name].forEach(connectedTable => {
          const delta = nodePositions[connectedTable].subtract(nodePositions[table.name]);
          if (delta.length > 0) {
            const attractiveForce = fa(delta.length);
            const direction = delta.normalize();
            
            displacements[connectedTable] = displacements[connectedTable].subtract(
              direction.multiply(attractiveForce)
            );
            displacements[table.name] = displacements[table.name].add(
              direction.multiply(attractiveForce)
            );
          }
        });
      });
      
      // Apply displacements limited by temperature
      tables.forEach(table => {
        const displacement = displacements[table.name];
        if (displacement.length > 0) {
          const limitedDisplacement = displacement.normalize().multiply(
            Math.min(displacement.length, t)
          );
          nodePositions[table.name] = nodePositions[table.name].add(limitedDisplacement);
          
          // Keep nodes within content-aware frame
          nodePositions[table.name] = createVector(
            Math.min(finalW/2, Math.max(-finalW/2, nodePositions[table.name].x)),
            Math.min(finalH/2, Math.max(-finalH/2, nodePositions[table.name].y))
          );
        }
      });
      
      // Cool down temperature
      t -= dt;
    }
    
    // Convert to final positions with centering offset
    const centerX = 800;
    const centerY = 600;
    const positions: Record<string, { x: number; y: number }> = {};
    
    tables.forEach(table => {
      positions[table.name] = {
        x: nodePositions[table.name].x + centerX,
        y: nodePositions[table.name].y + centerY
      };
    });
    
    console.log('Content-aware force-directed layout complete:', positions);
    return positions;
  }, [showColumns]); // Include showColumns dependency to recalculate when column visibility changes

  // Enhanced Hierarchical Layout with Layer Assignment
  const generateHierarchicalLayout = useCallback((tables: SchemaTable[]): Record<string, { x: number; y: number }> => {
    if (!tables.length) return {};
    
    console.log('Hierarchical layout: Processing', tables.length, 'tables');
    
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Build relationship graph
    const relationshipGraph: Record<string, string[]> = {};
    const incomingEdges: Record<string, string[]> = {};
    
    tables.forEach(table => {
      relationshipGraph[table.name] = [];
      incomingEdges[table.name] = [];
    });
    
    tables.forEach(table => {
      table.relationships.forEach(rel => {
        if (tables.some(t => t.name === rel.toTable)) {
          relationshipGraph[table.name].push(rel.toTable);
          incomingEdges[rel.toTable].push(table.name);
        }
      });
    });
    
    // Layer assignment using modified topological sort
    const layers: string[][] = [];
    const visited = new Set<string>();
    const tempMark = new Set<string>();
    
    // Find root nodes (no incoming edges) for starting points
    const rootNodes = tables
      .filter(table => incomingEdges[table.name].length === 0)
      .map(table => table.name);
    
    if (rootNodes.length === 0) {
      // If no clear roots, use most connected nodes
      const connectionCounts = tables.map(table => ({
        name: table.name,
        connections: relationshipGraph[table.name].length + incomingEdges[table.name].length
      }));
      connectionCounts.sort((a, b) => b.connections - a.connections);
      rootNodes.push(connectionCounts[0].name);
    }
    
    // Assign layers using BFS-like approach
    const nodeLayer: Record<string, number> = {};
    const queue = rootNodes.map(node => ({ node, layer: 0 }));
    
    while (queue.length > 0) {
      const { node, layer } = queue.shift()!;
      
      if (nodeLayer[node] !== undefined) {
        nodeLayer[node] = Math.max(nodeLayer[node], layer);
        continue;
      }
      
      nodeLayer[node] = layer;
      
      // Add children to next layer
      relationshipGraph[node].forEach(child => {
        if (nodeLayer[child] === undefined) {
          queue.push({ node: child, layer: layer + 1 });
        }
      });
    }
    
    // Handle unassigned nodes (put them in layer 0)
    tables.forEach(table => {
      if (nodeLayer[table.name] === undefined) {
        nodeLayer[table.name] = 0;
      }
    });
    
    // Group nodes by layer
    const maxLayer = Math.max(...Object.values(nodeLayer));
    for (let i = 0; i <= maxLayer; i++) {
      layers[i] = [];
    }
    
    tables.forEach(table => {
      layers[nodeLayer[table.name]].push(table.name);
    });
    
    // Position nodes within layers
    const nodeWidth = 320;
    const nodeHeight = 200;
    const horizontalSpacing = 100;
    const verticalSpacing = 250; // Larger spacing between layers
    
    layers.forEach((layer, layerIndex) => {
      const layerWidth = layer.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
      const startX = (1400 - layerWidth) / 2; // Center the layer
      const y = 200 + layerIndex * verticalSpacing;
      
      layer.forEach((tableName, index) => {
        const x = startX + index * (nodeWidth + horizontalSpacing);
        positions[tableName] = { x, y };
      });
    });
    
    console.log('Hierarchical layout complete:', { layers: layers.length, positions });
    return positions;
  }, []);

  // Smart Layout Algorithm - Prioritizes Force-Directed for Better Space Utilization
  const generateSmartLayout = useCallback((tables: SchemaTable[]) => {
    if (!tables.length) return {};
    
    console.log('Smart layout: Processing', tables.length, 'tables with enhanced force-directed algorithm');
    
    // Use force-directed layout as primary choice for better space utilization
    // Only use hierarchical for very specific cases with clear layer structures
    if (tables.length <= 30) {
      return generateForceDirectedLayout(tables);
    }
    
    // For larger graphs, check if there's a very clear hierarchical structure
    const relationshipGraph: Record<string, string[]> = {};
    const incomingEdges: Record<string, string[]> = {};
    
    tables.forEach(table => {
      relationshipGraph[table.name] = [];
      incomingEdges[table.name] = [];
    });
    
    tables.forEach(table => {
      table.relationships.forEach(rel => {
        if (tables.some(t => t.name === rel.toTable)) {
          relationshipGraph[table.name].push(rel.toTable);
          incomingEdges[rel.toTable].push(table.name);
        }
      });
    });
    
    // Only use hierarchical if there are clear root nodes and multiple layers
    const rootNodes = tables.filter(table => incomingEdges[table.name].length === 0);
    const leafNodes = tables.filter(table => relationshipGraph[table.name].length === 0);
    const hasMultipleLayers = rootNodes.length > 0 && leafNodes.length > 0 && rootNodes.length + leafNodes.length < tables.length * 0.8;
    
    if (hasMultipleLayers && tables.length > 30) {
      return generateHierarchicalLayout(tables);
    }
    
    // Default to force-directed for better space utilization multilevel approach
    return generateForceDirectedLayout(tables);
  }, [generateForceDirectedLayout, generateHierarchicalLayout]);

  // Smart Layout Handler
  const handleSmartLayout = useCallback(() => {
    if (!filteredTables.length) return;
    
    const smartPositions = generateSmartLayout(filteredTables);
    
    // Apply smart positions to nodes
    setNodes(currentNodes => {
      return currentNodes.map(node => ({
        ...node,
        position: smartPositions[node.id] || node.position
      }));
    });
    
    // Save these positions for the current filter
    const filterKey = `${selectedFeature}-${selectedCategory}-${layoutType}-${selectedTables.join(',')}-${showRelatedTables}`;
    setCustomPositions(prev => {
      const updated = { ...prev };
      updated[filterKey] = smartPositions;
      
      try {
        localStorage.setItem('dataSchemaCustomPositions', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save smart layout positions:', error);
      }
      
      return updated;
    });
    
    // Auto-fit view after applying smart layout
    setTimeout(() => {
      fitView({ 
        padding: 0.15, 
        minZoom: 0.05, 
        maxZoom: 2.0, 
        duration: 1000 
      });
    }, 100);
    
  }, [filteredTables, generateSmartLayout, setNodes, selectedFeature, selectedCategory, layoutType, selectedTables, showRelatedTables, setCustomPositions, fitView]);

  // Enhanced node change handler to save positions per filter
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Check if any changes are position changes from user dragging
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.dragging === false // Position settled after drag
    );
    
    if (positionChanges.length > 0) {
      // Create filter key based on current filter settings
      const filterKey = `${selectedFeature}-${selectedCategory}-${layoutType}-${selectedTables.join(',')}-${showRelatedTables}`;
      
      setCustomPositions(prev => {
        const updated = { ...prev };
        if (!updated[filterKey]) {
          updated[filterKey] = {};
        }
        
        // Update positions for changed nodes
        positionChanges.forEach(change => {
          updated[filterKey][change.id] = change.position;
        });
        
        // Save to localStorage
        try {
          localStorage.setItem('dataSchemaCustomPositions', JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save custom positions to localStorage:', error);
        }
        
        return updated;
      });
    }
  }, [onNodesChange, selectedFeature, selectedCategory, layoutType, selectedTables, showRelatedTables]);

  // Track filter changes to reset positions when filters change
  const filterState = useMemo(() => ({
    searchTerm,
    selectedCategory,
    selectedFeature,
    focusMode,
    focusTable,
    layoutType,
    selectedTables: selectedTables.join(','),
    showRelatedTables,
    selectedCards: selectedCards.join(',')
  }), [searchTerm, selectedCategory, selectedFeature, focusMode, focusTable, layoutType, selectedTables, showRelatedTables, selectedCards]);
  
  const [previousFilterState, setPreviousFilterState] = useState(filterState);
  const [shouldPreservePositions, setShouldPreservePositions] = useState(true);
  
  // Reset positions restored flag when filters change
  React.useEffect(() => {
    // Exclude selectedCards from filter change detection to prevent position reset on flag clicks
    const currentFilterStateWithoutCards = { ...filterState, selectedCards: '' };
    const previousFilterStateWithoutCards = { ...previousFilterState, selectedCards: '' };
    
    const filtersChanged = JSON.stringify(previousFilterStateWithoutCards) !== JSON.stringify(currentFilterStateWithoutCards);
    if (filtersChanged) {
      setPreviousFilterState(filterState);
      // Positions should always be restored from localStorage when filters change
      setPositionsRestored(true);
    } else {
      // Update previous state for selectedCards changes without triggering position reset
      setPreviousFilterState(filterState);
    }
  }, [filterState, previousFilterState]);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes((currentNodes) => {
      // Always preserve positions when they exist, except when filters have changed
      if (currentNodes.length > 0 && shouldPreservePositions) {
        const positionMap = new Map(currentNodes.map(node => [node.id, node.position]));
        
        return nodes.map(node => {
          const existingPosition = positionMap.get(node.id);
          return {
            ...node,
            // Preserve existing position if available, otherwise use new position
            position: existingPosition || node.position,
            // Update selection state without affecting position
            selected: node.selected
          };
        });
      } else {
        // Use new intelligent layout positions when filters change or no existing positions
        setPositionsRestored(true);
        return nodes;
      }
    });
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges, shouldPreservePositions]);

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

  const handleNodeClick = useCallback((event: any, node: Node) => {
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
      {/* Header - Mobile Optimized with better responsive design */}
      {!isFullScreen && (
        <div className="border-b bg-white px-3 sm:px-6 py-2 sm:py-3 relative z-20 min-h-0">
        {/* Title Row - Compact on Mobile with proper spacing */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h1 className="text-base sm:text-2xl font-bold">Data Schema</h1>
            <Badge variant="outline" className="text-xs">
              {filteredTables.length}
            </Badge>
          </div>
          
          {/* Top Right Controls - Essential buttons only, responsive */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Essential controls only - show most important ones */}
            <Button 
              onClick={() => {
                console.log('🏠 Navigating to homepage...');
                setLocation('/');
              }}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="w-4 h-4" />
            </Button>
            
            {/* Full Screen Toggle - Always visible for better UX */}
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
                <TooltipContent side="bottom">
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
        
        {/* Main Controls - Better responsive layout */}
        <div className="space-y-3">
          {/* Primary Controls Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search - Full width on mobile */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Table Selection Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTableSelector(!showTableSelector)}
                    className={`flex-shrink-0 ${selectedTables.length > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Tables </span>({selectedTables.length})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select specific tables to display</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Secondary Controls Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Feature Filter */}
            <Select value={selectedFeature} onValueChange={handleFeatureChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Feature" />
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
              <SelectTrigger className="w-full sm:w-40">
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
            
            {/* Layout - Compact on all screens */}
            <Select value={layoutType} onValueChange={(value: any) => setLayoutType(value)}>
              <SelectTrigger className="w-20 sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hierarchical">Tree</SelectItem>
                <SelectItem value="circular">Circle</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Quick Action Buttons - Always visible */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex-shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Refresh schema</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fitView({ padding: 0.2, minZoom: 0.05, maxZoom: 2.0, duration: 800 })}
                    className="flex-shrink-0"
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Fit to view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* View Options Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* View Toggle Options */}
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
              <Label htmlFor="show-relationships" className="text-xs sm:text-sm">Lines</Label>
            </div>
            
            {showRelationships && (
              <div className="flex items-center gap-1">
                <Switch
                  id="simplify-lines"
                  checked={simplifyLines}
                  onCheckedChange={setSimplifyLines}
                  className="scale-75 sm:scale-100"
                />
                <Label htmlFor="simplify-lines" className="text-xs sm:text-sm">Straight</Label>
              </div>
            )}
            
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
            
            {/* Additional Controls - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2">
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
                  <TooltipContent side="bottom">
                    <p>{showMiniMap ? 'Hide' : 'Show'} MiniMap</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsLassoMode(!isLassoMode);
                        if (isLassoMode) {
                          setLassoPath([]);
                          setIsDrawing(false);
                        }
                      }}
                      className={isLassoMode ? 'ring-2 ring-purple-500 bg-purple-50' : ''}
                    >
                      {isLassoMode ? <MousePointer className="w-4 h-4" /> : <Lasso className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{isLassoMode ? 'Exit Lasso Mode' : 'Enable Lasso Selection'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {lassoSelection.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => zoomToLassoSelection(nodes)}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Focus className="w-4 h-4" />
                </Button>
              )}
              
              {zoomedToLasso && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetLassoZoom}
                  className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
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
        
        {/* Card Selection Status - Floating overlay that doesn't affect layout */}
        {selectedCards.length > 0 && !isFullScreen && (
          <div className="absolute top-full left-4 right-4 z-40 flex items-center justify-between gap-4 bg-green-50 border border-green-200 px-3 py-2 rounded-lg shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-green-600" />
              <Label className="text-sm text-green-800 font-medium">
                {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected for relationship analysis
              </Label>
              <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                {selectedCards.join(', ')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCards([])}
              className="text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              Clear Selection
            </Button>
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
                    onClick={() => {
                      // Select all tables that have any relationships (incoming or outgoing)
                      const tablesWithRelations = filteredTables.filter(table => {
                        // Check if table has outgoing relationships
                        const hasOutgoingRelations = table.relationships.length > 0;
                        
                        // Check if table has incoming relationships (other tables reference this table)
                        const hasIncomingRelations = filteredTables.some(otherTable => 
                          otherTable.relationships.some(rel => rel.toTable === table.name)
                        );
                        
                        return hasOutgoingRelations || hasIncomingRelations;
                      }).map(t => t.name);
                      
                      setSelectedTables(tablesWithRelations);
                    }}
                  >
                    <Link2 className="w-3 h-3 mr-1" />
                    With Relations
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

      {/* Floating Homepage Button - Bottom right corner for visibility */}
      {!isFullScreen && (
        <div className="fixed bottom-8 right-8 z-40">
          <Button 
            onClick={() => {
              console.log('🏠 Navigating to homepage...');
              setLocation('/');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl border-2 border-white"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            <span className="font-semibold">Go to Homepage</span>
          </Button>
        </div>
      )}
      
      {/* Schema Diagram */}
      <div className={`${isFullScreen ? 'h-screen' : 'flex-1'} relative`}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onMouseDown={handleLassoMouseDown}
          onMouseMove={handleLassoMouseMove}
          onMouseUp={() => handleLassoMouseUp(nodes)}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ cursor: isLassoMode ? 'crosshair' : 'default' }}
        >
          <Background 
            gap={20} 
            size={1}
            style={{ backgroundColor: 'transparent' }}
          />
          <Controls />
          
          {/* Lasso Selection Path Overlay */}
          {isLassoMode && lassoPath.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              <path
                d={`M ${lassoPath.map(point => `${point.x} ${point.y}`).join(' L ')}`}
                stroke="#8b5cf6"
                strokeWidth="2"
                fill="rgba(139, 92, 246, 0.1)"
                strokeDasharray="5,5"
              />
            </svg>
          )}
          
          {/* Lasso Mode Indicator */}
          {isLassoMode && (
            <Panel position="top-center" className="z-50">
              <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg shadow-sm">
                <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                  <Lasso className="w-4 h-4" />
                  Lasso Mode Active - Draw around tables to select them
                </p>
              </div>
            </Panel>
          )}
          
          {/* Lasso Selection Status */}
          {lassoSelection.length > 0 && (
            <Panel position="bottom-center" className="z-50">
              <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg shadow-sm">
                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  {lassoSelection.length} tables selected
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => zoomToLassoSelection(nodes)}
                    className="ml-2 h-6 px-2 text-xs text-green-700 hover:bg-green-100"
                  >
                    <Focus className="w-3 h-3 mr-1" />
                    Zoom to Selection
                  </Button>
                </p>
              </div>
            </Panel>
          )}
          
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
          <Panel position="top-right" className="flex flex-col gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newZoom = Math.max(0.1, zoomLevel[0] - 0.2);
                        handleZoomChange([newZoom]);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Zoom out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <Slider
                  value={zoomLevel}
                  onValueChange={handleZoomChange}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-20"
                />
                <span className="text-xs text-gray-600 font-mono">
                  {Math.round(zoomLevel[0] * 100)}%
                </span>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newZoom = Math.min(3.0, zoomLevel[0] + 0.2);
                        handleZoomChange([newZoom]);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Zoom in</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Other Control Buttons */}
            <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log('Smart Layout clicked');
                      if (typeof handleSmartLayout === 'function') {
                        handleSmartLayout();
                      } else {
                        console.error('handleSmartLayout is not a function');
                      }
                    }}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Smart Layout - Reorganize tables to minimize relationship confusion and maximize visibility</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
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
                <TooltipContent side="bottom">
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
                <TooltipContent side="bottom">
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
                <TooltipContent side="bottom">
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
                <TooltipContent side="bottom">
                  <p>{isFullScreen ? 'Exit' : 'Enter'} full screen mode (F11 or Esc)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
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
            <Panel position="bottom-right" className="z-50">
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-gray-200">
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
                    <h4 className="font-medium">Card Selection:</h4>
                    <div className="flex items-center gap-2">
                      <Flag className="w-3 h-3 text-green-600" />
                      <span className="text-xs">Click flag to select cards for focused relationship analysis</span>
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