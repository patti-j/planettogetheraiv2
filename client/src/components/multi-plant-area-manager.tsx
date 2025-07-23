import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Factory, Layers, Plus, Minus, MapPin, 
  Filter, Users, Settings, CheckCircle2, AlertCircle
} from "lucide-react";

interface Plant {
  id: number;
  name: string;
  location: string;
  isActive: boolean;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  plantId: number;
  area?: string;
  capabilities: string;
  status: string;
  isShared?: boolean;
  sharedPlants?: number[];
}

interface AreaManagerDialogProps {
  areas: {[key: string]: {name: string, resources: number[]}};
  resources: Resource[];
  onCreateArea: (name: string, resourceIds: number[]) => void;
  onDeleteArea: (areaKey: string) => void;
  onClose: () => void;
}

export const MultiPlantAreaManager: React.FC<AreaManagerDialogProps> = ({ 
  areas, 
  resources, 
  onCreateArea, 
  onDeleteArea, 
  onClose 
}) => {
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | 'all'>('all');
  const [filterByPlant, setFilterByPlant] = useState(true);

  // Fetch plants for filtering
  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  // Filter resources by selected plant
  const filteredResources = selectedPlantId === 'all' 
    ? resources 
    : resources.filter(resource => 
        resource.plantId === selectedPlantId || 
        (resource.isShared && resource.sharedPlants?.includes(selectedPlantId as number))
      );

  const handleCreateArea = () => {
    if (newAreaName.trim() && selectedResources.length > 0) {
      onCreateArea(newAreaName.trim(), selectedResources);
      setNewAreaName('');
      setSelectedResources([]);
    }
  };

  const handleResourceToggle = (resourceId: number) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const getResourcesByPlant = (plantId: number | 'all') => {
    if (plantId === 'all') return resources;
    return resources.filter(resource => 
      resource.plantId === plantId || 
      (resource.isShared && resource.sharedPlants?.includes(plantId))
    );
  };

  const getPlantName = (plantId: number) => {
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || `Plant ${plantId}`;
  };

  return (
    <div className="space-y-6">
      {/* Plant Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Multi-Plant Area Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Plant Filter Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter by Plant</span>
              </div>
              <Checkbox 
                checked={filterByPlant} 
                onCheckedChange={(checked) => {
                  setFilterByPlant(checked as boolean);
                  if (!checked) setSelectedPlantId('all');
                }}
              />
            </div>

            {/* Plant Selector */}
            {filterByPlant && (
              <div className="space-y-2">
                <Label htmlFor="plant-select">Select Plant</Label>
                <Select 
                  value={selectedPlantId.toString()} 
                  onValueChange={(value) => setSelectedPlantId(value === 'all' ? 'all' : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4" />
                        All Plants ({resources.length} resources)
                      </div>
                    </SelectItem>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {plant.name} ({getResourcesByPlant(plant.id).length} resources)
                          {plant.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {plant.location}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Plant Summary */}
            {selectedPlantId !== 'all' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {getPlantName(selectedPlantId as number)}
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  Managing {filteredResources.length} resources from this plant
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="area-name">Area Name</Label>
              <Input
                id="area-name"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Enter area name..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                Select Resources ({selectedResources.length} selected)
              </Label>
              
              {filteredResources.length === 0 ? (
                <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No resources available in selected plant</p>
                  <p className="text-sm">Try selecting a different plant or "All Plants"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredResources.map((resource) => (
                    <div 
                      key={resource.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedResources.includes(resource.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleResourceToggle(resource.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => handleResourceToggle(resource.id)}
                        />
                        <span className="font-medium text-sm">{resource.name}</span>
                        {resource.isShared && (
                          <Badge variant="secondary" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 ml-6">
                        <div>{resource.type} • {getPlantName(resource.plantId)}</div>
                        <div className="text-gray-500">{resource.capabilities}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={handleCreateArea}
              disabled={!newAreaName.trim() || selectedResources.length === 0}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Area ({selectedResources.length} resources)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Existing Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(areas).length === 1 ? (
              <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No custom areas created yet</p>
                <p className="text-sm">Create your first area using the form above</p>
              </div>
            ) : (
              Object.entries(areas).map(([key, area]) => {
                if (key === 'all') return null;
                
                // Get resources in this area and group by plant
                const areaResources = resources.filter(r => area.resources.includes(r.id));
                const plantGroups = areaResources.reduce((acc, resource) => {
                  const plantName = getPlantName(resource.plantId);
                  if (!acc[plantName]) acc[plantName] = [];
                  acc[plantName].push(resource);
                  return acc;
                }, {} as Record<string, Resource[]>);

                return (
                  <div key={key} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-lg">{area.name}</h4>
                        <Badge variant="outline">
                          {area.resources.length} resources
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteArea(key)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Resources grouped by plant */}
                    <div className="space-y-2">
                      {Object.entries(plantGroups).map(([plantName, plantResources]) => (
                        <div key={plantName} className="p-2 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm text-gray-800">{plantName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {plantResources.length} resources
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                            {plantResources.map((resource) => (
                              <div key={resource.id} className="text-xs p-1 bg-white rounded border">
                                <div className="font-medium truncate">{resource.name}</div>
                                <div className="text-gray-500 truncate">{resource.type}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default MultiPlantAreaManager;