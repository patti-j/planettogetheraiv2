import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// Removed useNavigation import - automatic page tracking was causing infinite loop
import { Network, Database, Factory, Package, Users, Wrench, Cog, Building, List, Route, Beaker, Settings, TrendingUp, Edit2, Maximize2, X, Search, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  NodeTypes,
  Handle,
  Position,
  ReactFlowProvider,
} from 'reactflow';

// Custom node component for data objects
const DataObjectNode = ({ data }: { data: any }) => {
  const { object, onEdit, onExpand, onFocus } = data;
  
  const getIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      plants: Building,
      resources: Wrench,
      capabilities: Database,
      operations: Cog,
      productionOrders: Package,
      billsOfMaterial: List,
      routings: Route,
      recipes: Beaker,
      productionVersions: Settings,
      forecasts: TrendingUp,
      vendors: Building,
      customers: Users,
      default: Factory
    };
    const IconComponent = iconMap[type] || iconMap.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getNodeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      plants: 'bg-blue-100 border-blue-300',
      resources: 'bg-green-100 border-green-300',
      capabilities: 'bg-purple-100 border-purple-300',
      operations: 'bg-orange-100 border-orange-300',
      productionOrders: 'bg-red-100 border-red-300',
      billsOfMaterial: 'bg-yellow-100 border-yellow-300',
      routings: 'bg-indigo-100 border-indigo-300',
      recipes: 'bg-pink-100 border-pink-300',
      productionVersions: 'bg-gray-100 border-gray-300',
      default: 'bg-slate-100 border-slate-300'
    };
    return colorMap[object.type] || colorMap.default;
  };

  return (
    <div className={`p-3 rounded-lg border-2 min-w-[200px] shadow-lg ${getNodeColor(object.type)} ${data.focused ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      
      <div className="flex items-center gap-2 mb-2">
        {getIcon(object.type)}
        <span className="font-medium text-sm text-gray-700">{object.type}</span>
      </div>
      
      <div className="mb-2">
        <div className="font-semibold text-gray-900">{object.name || object.versionNumber || object.itemNumber || `${object.type}-${object.id}`}</div>
        {object.description && (
          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{object.description}</div>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => onEdit(object)}
        >
          <Edit2 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => onExpand(object)}
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => onFocus(object)}
        >
          Focus
        </Button>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  dataObject: DataObjectNode,
};

interface DataObject {
  id: number;
  type: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

interface DataRelationship {
  from: DataObject;
  to: DataObject;
  relationshipType: string;
  description?: string;
}

function DataMapView() {
  const [selectedObjectType, setSelectedObjectType] = useState<string>('');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedObject, setFocusedObject] = useState<DataObject | null>(null);
  const [editingObject, setEditingObject] = useState<DataObject | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // REMOVED: Automatic page registration was causing infinite loop
  // Manual navigation tracking is handled by menu clicks instead

  // Supported data types for the map
  const dataTypes = [
    { key: 'plants', label: 'Plants', icon: Building },
    { key: 'resources', label: 'Resources', icon: Wrench },
    { key: 'capabilities', label: 'Capabilities', icon: Database },
    { key: 'operations', label: 'Operations', icon: Cog },
    { key: 'productionOrders', label: 'Production Orders', icon: Package },
    { key: 'billsOfMaterial', label: 'Bills of Material', icon: List },
    { key: 'routings', label: 'Routings', icon: Route },
    { key: 'recipes', label: 'Recipes', icon: Beaker },
    { key: 'productionVersions', label: 'Production Versions', icon: Settings },
    { key: 'vendors', label: 'Vendors', icon: Building },
    { key: 'customers', label: 'Customers', icon: Users },
  ];

  // Fetch available objects of selected type
  const { data: availableObjects = [], isLoading: isLoadingObjects, error } = useQuery({
    queryKey: ['/api/data-map/objects', selectedObjectType],
    queryFn: async () => {
      if (!selectedObjectType) return [];
      console.log('Fetching objects for type:', selectedObjectType);
      const response = await apiRequest('GET', `/api/data-map/objects/${selectedObjectType}`);
      console.log('API response for objects:', response);
      const result = Array.isArray(response) ? response : [];
      console.log('Processed result:', result);
      return result;
    },
    enabled: !!selectedObjectType,
  });

  // Fetch data relationships for focused object
  const { data: relationships = [], isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['/api/data-map/relationships', focusedObject?.type, focusedObject?.id],
    queryFn: async () => {
      if (!focusedObject) return [];
      const response = await apiRequest('GET', `/api/data-map/relationships/${focusedObject.type}/${focusedObject.id}`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!focusedObject,
  });

  // Build the visual graph
  useEffect(() => {
    if (!focusedObject || !relationships) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create nodes
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Add the focused object as the center node
    newNodes.push({
      id: `${focusedObject.type}-${focusedObject.id}`,
      type: 'dataObject',
      position: { x: 400, y: 300 },
      data: {
        object: { ...focusedObject, type: focusedObject.type },
        focused: true,
        onEdit: handleEditObject,
        onExpand: handleExpandObject,
        onFocus: handleFocusObject,
      },
    });

    // Add related objects as surrounding nodes
    relationships.forEach((rel: DataRelationship, index: number) => {
      const angle = (index * 2 * Math.PI) / relationships.length;
      const radius = 250;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      const relatedObject = rel.to.id === focusedObject.id ? rel.from : rel.to;
      const nodeId = `${relatedObject.type}-${relatedObject.id}`;

      // Add related object node
      newNodes.push({
        id: nodeId,
        type: 'dataObject',
        position: { x, y },
        data: {
          object: relatedObject,
          focused: false,
          onEdit: handleEditObject,
          onExpand: handleExpandObject,
          onFocus: handleFocusObject,
        },
      });

      // Add edge
      newEdges.push({
        id: `edge-${focusedObject.type}-${focusedObject.id}-${nodeId}`,
        source: `${focusedObject.type}-${focusedObject.id}`,
        target: nodeId,
        label: rel.relationshipType,
        style: { stroke: '#64748b', strokeWidth: 2 },
        labelStyle: { fontSize: '12px', fontWeight: 500 },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#f1f5f9', color: '#334155' },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [focusedObject, relationships]);

  const handleFocusObject = useCallback((object: DataObject) => {
    setFocusedObject(object);
  }, []);

  const handleEditObject = useCallback((object: DataObject) => {
    setEditingObject(object);
    setShowEditDialog(true);
  }, []);

  const handleExpandObject = useCallback((object: DataObject) => {
    // Find related objects for the clicked object and add them to the map
    handleFocusObject(object);
  }, [handleFocusObject]);

  const handleObjectSelect = () => {
    if (!selectedObjectType || !selectedObjectId) return;
    
    const selectedObject = availableObjects.find((obj: any) => obj.id.toString() === selectedObjectId);
    if (selectedObject) {
      setFocusedObject({ ...selectedObject, type: selectedObjectType });
    }
  };

  const filteredObjects = availableObjects.filter((obj: any) =>
    searchTerm === '' || 
    (obj.name && obj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-screen w-full bg-white">
      {/* Header Panel */}
      <Panel position="top-left" className="m-2 sm:m-4">
        <Card className="w-72 sm:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Data Relationship Map
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
                className="h-10 w-10 sm:h-8 sm:w-8 p-0"
                title={showLegend ? "Hide Legend" : "Show Legend"}
              >
                {showLegend ? <ToggleRight className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600" /> : <ToggleLeft className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data Type</label>
              <Select value={selectedObjectType} onValueChange={setSelectedObjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedObjectType && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Search Objects</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Select Object</label>
                  <Select value={selectedObjectId} onValueChange={setSelectedObjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingObjects ? "Loading objects..." : filteredObjects.length === 0 ? "No objects found" : "Choose an object"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingObjects ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : filteredObjects.length === 0 ? (
                        <SelectItem value="empty" disabled>No {selectedObjectType} found</SelectItem>
                      ) : (
                        filteredObjects.map((obj: any) => (
                          <SelectItem key={obj.id} value={obj.id.toString()}>
                            {obj.name || obj.versionNumber || obj.itemNumber || `${selectedObjectType}-${obj.id}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {error && (
                    <div className="text-xs text-red-500 mt-1">
                      Error loading objects: {error.message}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Found {filteredObjects.length} objects
                  </div>
                </div>

                <Button onClick={handleObjectSelect} className="w-full" disabled={!selectedObjectId}>
                  Generate Data Map
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Panel>

      {/* Current Focus Panel */}
      {focusedObject && (
        <Panel position="top-right" className="m-4">
          <Card className="w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Focused Object</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{focusedObject.name || focusedObject.versionNumber || focusedObject.itemNumber || `${focusedObject.type}-${focusedObject.id}`}</div>
                <div className="text-gray-600 capitalize">{focusedObject.type}</div>
                {focusedObject.description && (
                  <div className="text-xs text-gray-500 mt-1">{focusedObject.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {isLoadingRelationships ? 'Loading relationships...' : `${relationships.length} connections found`}
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls />
        
        {/* Legend Panel */}
        {showLegend && (
          <Panel position="bottom-right" className="m-2 sm:m-4">
            <Card className="bg-white/90 backdrop-blur-sm w-64 sm:w-auto">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Legend
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLegend(false)}
                    className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 -mt-1 ml-3"
                  >
                    <X className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400 hover:text-gray-600" />
                  </Button>
                </div>
                <div className="space-y-2 text-xs">
                  <h4 className="font-medium text-sm">Data Types:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3 text-green-600" />
                      <span>Plants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3 h-3 text-blue-600" />
                      <span>Resources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3 text-purple-600" />
                      <span>Capabilities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cog className="w-3 h-3 text-orange-600" />
                      <span>Operations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3 text-red-600" />
                      <span>Production Orders</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 mt-3">
                    <h4 className="font-medium text-sm mb-1">Node Actions:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Click to focus relationships</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Edit2 className="w-3 h-3 text-gray-500" />
                        <span>Edit button to modify</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-3 h-3 text-gray-500" />
                        <span>Expand for details</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}
      </ReactFlow>

      {/* Edit Object Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingObject?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Object editing functionality would be integrated here, connecting to the existing Master Data Setup forms.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Edit functionality coming soon" });
                setShowEditDialog(false);
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export with ReactFlowProvider wrapper to fix zustand provider error
export default function DataMap() {
  return (
    <ReactFlowProvider>
      <DataMapView />
    </ReactFlowProvider>
  );
}