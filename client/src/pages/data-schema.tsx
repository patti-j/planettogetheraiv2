import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  MarkerType,
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
  Info
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
  const { table, showColumns, showRelationships } = data;
  
  return (
    <Card className="min-w-[250px] max-w-[350px] shadow-lg border-2" 
          style={{ borderColor: getCategoryColor(table.category) }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Table className="w-4 h-4" />
          {table.name}
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

export default function DataSchemaView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'circular' | 'grid'>('hierarchical');
  const [showColumns, setShowColumns] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch database schema information
  const { data: schemaData, isLoading, error } = useQuery({
    queryKey: ['/api/database/schema'],
    queryFn: async (): Promise<SchemaTable[]> => {
      const response = await apiRequest('GET', '/api/database/schema');
      console.log('Raw API response:', typeof response, response);
      
      // Handle both direct array and wrapped response formats
      let data: SchemaTable[] = [];
      if (Array.isArray(response)) {
        data = response as SchemaTable[];
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
        data = (response as any).data as SchemaTable[];
      } else if (response && typeof response === 'object') {
        // If it's an object but not wrapped in data, try to convert to array
        data = Object.values(response).filter(item => 
          item && typeof item === 'object' && (item as any).name
        ) as SchemaTable[];
      }
      
      console.log('Schema data processed:', data.length, 'tables');
      return data;
    },
  });

  // Filter tables based on search and category
  const filteredTables = useMemo(() => {
    if (!schemaData || !Array.isArray(schemaData)) return [];
    
    return schemaData.filter((table: SchemaTable) => {
      const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           table.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           table.columns.some((col: any) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || table.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [schemaData, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!schemaData || !Array.isArray(schemaData)) return [];
    return Array.from(new Set(schemaData.map((table: SchemaTable) => table.category)));
  }, [schemaData]);

  // Generate nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    if (!filteredTables.length) return { nodes: [], edges: [] };
    
    const positions = layoutAlgorithms[layoutType](filteredTables);
    
    const flowNodes: Node[] = filteredTables.map(table => ({
      id: table.name,
      type: 'default',
      position: positions[table.name],
      data: { 
        table, 
        showColumns, 
        showRelationships,
        label: <TableNode data={{ table, showColumns, showRelationships }} />
      },
      style: {
        background: 'transparent',
        border: 'none',
      }
    }));

    const flowEdges: Edge[] = [];
    
    if (showRelationships) {
      filteredTables.forEach(table => {
        table.relationships.forEach(rel => {
          if (filteredTables.some(t => t.name === rel.toTable)) {
            flowEdges.push({
              id: `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}`,
              source: rel.fromTable,
              target: rel.toTable,
              type: 'smoothstep',
              animated: false,
              style: { 
                stroke: getCategoryColor(table.category),
                strokeWidth: 2,
              },
              label: `${rel.type}`,
              labelStyle: { 
                fontSize: 10,
                fill: '#666',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: getCategoryColor(table.category),
              }
            });
          }
        });
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [filteredTables, layoutType, showColumns, showRelationships]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleTableClick = useCallback((event: any, node: Node) => {
    setSelectedTable(node.id);
  }, []);

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
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Data Schema View</h1>
          <Badge variant="outline">
            {filteredTables.length} tables
          </Badge>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tables, columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
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
          
          <Select value={layoutType} onValueChange={(value: any) => setLayoutType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hierarchical">Hierarchical</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-columns"
                checked={showColumns}
                onCheckedChange={setShowColumns}
              />
              <Label htmlFor="show-columns" className="text-sm">Show Columns</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="show-relationships"
                checked={showRelationships}
                onCheckedChange={setShowRelationships}
              />
              <Label htmlFor="show-relationships" className="text-sm">Show Relationships</Label>
            </div>
          </div>
        </div>
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