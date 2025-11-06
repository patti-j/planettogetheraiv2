import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  MapPin, 
  Settings, 
  Save,
  RefreshCw,
  CheckSquare,
  Square,
  Filter,
  Factory,
  Wrench
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ResourcePlanningAssignment() {
  const { toast } = useToast();
  const [selectedResources, setSelectedResources] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlanningArea, setFilterPlanningArea] = useState('all');
  const [filterPlant, setFilterPlant] = useState('all');
  const [bulkPlanningArea, setBulkPlanningArea] = useState('');

  // Fetch resources
  const { data: resources, isLoading: loadingResources, refetch: refetchResources } = useQuery({
    queryKey: ['/api/resources'],
    queryFn: async () => {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    }
  });

  // Fetch planning areas
  const { data: planningAreas, isLoading: loadingPlanningAreas } = useQuery({
    queryKey: ['/api/planning-areas'],
    queryFn: async () => {
      const response = await fetch('/api/planning-areas');
      if (!response.ok) throw new Error('Failed to fetch planning areas');
      return response.json();
    }
  });

  // Fetch plants for filtering
  const { data: plants } = useQuery({
    queryKey: ['/api/plants'],
    queryFn: async () => {
      const response = await fetch('/api/plants');
      if (!response.ok) throw new Error('Failed to fetch plants');
      return response.json();
    }
  });

  // Mutation to update resource planning area
  const updateResourceMutation = useMutation({
    mutationFn: async ({ resourceId, planningArea }: { resourceId: number; planningArea: string }) => {
      return apiRequest(`/api/resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify({ planning_area: planningArea })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ resourceIds, planningArea }: { resourceIds: number[]; planningArea: string }) => {
      const promises = resourceIds.map(id => 
        apiRequest(`/api/resources/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ planning_area: planningArea })
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      setSelectedResources(new Set());
      setBulkPlanningArea('');
      toast({
        title: 'Success',
        description: `Updated ${selectedResources.size} resources successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update resources',
        variant: 'destructive'
      });
    }
  });

  // Filter resources based on search and filters
  const filteredResources = resources?.filter((resource: any) => {
    const matchesSearch = searchTerm === '' || 
      resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.resource_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.department_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlanningArea = filterPlanningArea === 'all' || 
      resource.planning_area === filterPlanningArea ||
      (filterPlanningArea === 'unassigned' && !resource.planning_area);
    
    const matchesPlant = filterPlant === 'all' || 
      resource.plant_name === filterPlant;
    
    return matchesSearch && matchesPlanningArea && matchesPlant;
  }) || [];

  // Handle individual resource planning area update
  const handleUpdateResource = async (resourceId: number, planningArea: string) => {
    try {
      await updateResourceMutation.mutateAsync({ resourceId, planningArea });
      toast({
        title: 'Success',
        description: 'Resource updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update resource',
        variant: 'destructive'
      });
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (selectedResources.size === 0 || !bulkPlanningArea) {
      toast({
        title: 'Warning',
        description: 'Please select resources and a planning area',
        variant: 'destructive'
      });
      return;
    }

    await bulkUpdateMutation.mutateAsync({
      resourceIds: Array.from(selectedResources),
      planningArea: bulkPlanningArea
    });
  };

  // Toggle resource selection
  const toggleResourceSelection = (resourceId: number) => {
    const newSelection = new Set(selectedResources);
    if (newSelection.has(resourceId)) {
      newSelection.delete(resourceId);
    } else {
      newSelection.add(resourceId);
    }
    setSelectedResources(newSelection);
  };

  // Select all filtered resources
  const selectAllFiltered = () => {
    const allFilteredIds = new Set(filteredResources.map((r: any) => r.id));
    setSelectedResources(allFilteredIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedResources(new Set());
  };

  // Get unique plants and planning areas for filters
  const uniquePlants = [...new Set(resources?.map((r: any) => r.plant_name).filter(Boolean))] as string[];
  const allPlanningAreaOptions = ['Plan 1', 'Plan 2', 'Plan 3'];

  if (loadingResources || loadingPlanningAreas) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Resource Planning Area Assignment
          </h1>
          <p className="text-muted-foreground mt-2">
            Assign resources to planning areas for optimized scheduling
          </p>
        </div>
        <Button 
          onClick={() => refetchResources()} 
          variant="outline"
          data-testid="button-refresh-resources"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Bulk Actions</CardTitle>
          <CardDescription>Filter resources and perform bulk assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-resources"
              />
            </div>

            {/* Filter by Planning Area */}
            <Select value={filterPlanningArea} onValueChange={setFilterPlanningArea}>
              <SelectTrigger data-testid="select-filter-planning-area">
                <SelectValue placeholder="Filter by planning area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all-areas">All Planning Areas</SelectItem>
                <SelectItem value="unassigned" data-testid="option-unassigned">Unassigned</SelectItem>
                {allPlanningAreaOptions.map(area => (
                  <SelectItem key={area} value={area} data-testid={`option-area-${area}`}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter by Plant */}
            <Select value={filterPlant} onValueChange={setFilterPlant}>
              <SelectTrigger data-testid="select-filter-plant">
                <SelectValue placeholder="Filter by plant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all-plants">All Plants</SelectItem>
                {uniquePlants.map(plant => (
                  <SelectItem key={plant} value={plant} data-testid={`option-plant-${plant}`}>
                    {plant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selection Controls */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={selectAllFiltered}
                data-testid="button-select-all"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearSelection}
                data-testid="button-clear-selection"
              >
                <Square className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Bulk Assignment */}
          {selectedResources.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedResources.size} resource(s) selected
              </span>
              <Select value={bulkPlanningArea} onValueChange={setBulkPlanningArea}>
                <SelectTrigger className="w-48" data-testid="select-bulk-planning-area">
                  <SelectValue placeholder="Assign to area..." />
                </SelectTrigger>
                <SelectContent>
                  {allPlanningAreaOptions.map(area => (
                    <SelectItem key={area} value={area} data-testid={`option-bulk-${area}`}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkUpdate}
                disabled={!bulkPlanningArea || bulkUpdateMutation.isPending}
                data-testid="button-bulk-assign"
              >
                <Save className="h-4 w-4 mr-2" />
                {bulkUpdateMutation.isPending ? 'Updating...' : 'Assign Selected'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources ({filteredResources.length})</CardTitle>
          <CardDescription>
            Showing {filteredResources.length} of {resources?.length || 0} total resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={filteredResources.length > 0 && 
                        filteredResources.every((r: any) => selectedResources.has(r.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllFiltered();
                        } else {
                          clearSelection();
                        }
                      }}
                      data-testid="checkbox-select-all-header"
                    />
                  </TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Planning Area</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource: any) => (
                  <TableRow key={resource.id} data-testid={`row-resource-${resource.id}`}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedResources.has(resource.id)}
                        onCheckedChange={() => toggleResourceSelection(resource.id)}
                        data-testid={`checkbox-resource-${resource.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {resource.resource_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        {resource.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        {resource.plant_name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{resource.department_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {resource.capacity_type || 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={resource.planning_area || 'unassigned'}
                        onValueChange={(value) => {
                          if (value !== 'unassigned') {
                            handleUpdateResource(resource.id, value);
                          }
                        }}
                        disabled={updateResourceMutation.isPending}
                      >
                        <SelectTrigger 
                          className="w-32"
                          data-testid={`select-planning-area-${resource.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned" disabled>Unassigned</SelectItem>
                          {allPlanningAreaOptions.map(area => (
                            <SelectItem 
                              key={area} 
                              value={area}
                              data-testid={`option-${resource.id}-${area}`}
                            >
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {resource.planning_area && (
                        <Badge 
                          variant={
                            resource.planning_area === 'Plan 3' ? 'secondary' : 'default'
                          }
                        >
                          {planningAreas?.find((pa: any) => pa.name === resource.planning_area)?.optimizationMethod === 'advanced_solver' 
                            ? 'Advanced Solver' 
                            : 'Optimization Studio'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}