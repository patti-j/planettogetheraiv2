import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';

interface Resource {
  id: number;
  resource_id: string;
  name: string;
  plant_name: string;
  department_name: string;
  planning_area?: string;
}

export default function PlanningAreaManager() {
  const { toast } = useToast();
  const [resourceUpdates, setResourceUpdates] = useState<Record<number, string>>({});

  const { data: resources = [], isLoading, refetch } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { resourceId: number; planningArea: string }[]) => {
      return apiRequest('/api/resources/planning-areas', 'PATCH', { updates });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Planning areas updated successfully',
      });
      setResourceUpdates({});
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update planning areas',
        variant: 'destructive',
      });
    },
  });

  const handlePlanningAreaChange = (resourceId: number, planningArea: string) => {
    setResourceUpdates(prev => ({
      ...prev,
      [resourceId]: planningArea,
    }));
  };

  const handleSave = () => {
    const updates = Object.entries(resourceUpdates).map(([resourceId, planningArea]) => ({
      resourceId: parseInt(resourceId),
      planningArea,
    }));

    if (updates.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No planning area updates to save',
      });
      return;
    }

    updateMutation.mutate(updates);
  };

  const hasChanges = Object.keys(resourceUpdates).length > 0;

  // Get unique planning areas
  const planningAreas = Array.from(
    new Set(
      resources
        .map(r => r.planning_area)
        .filter(Boolean)
    )
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Planning Area Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assign planning areas to resources for filtered scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            data-testid="button-save"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : `Save${hasChanges ? ` (${Object.keys(resourceUpdates).length})` : ''}`}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : (
        <div className="border rounded-lg dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource ID</TableHead>
                <TableHead>Resource Name</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Planning Area</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => {
                const currentValue = resourceUpdates[resource.id] ?? resource.planning_area ?? '';
                const hasChange = resourceUpdates.hasOwnProperty(resource.id);

                return (
                  <TableRow
                    key={resource.id}
                    className={hasChange ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    data-testid={`row-resource-${resource.id}`}
                  >
                    <TableCell className="font-mono text-sm">
                      {resource.resource_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {resource.name}
                    </TableCell>
                    <TableCell>{resource.plant_name || '—'}</TableCell>
                    <TableCell>{resource.department_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          value={currentValue}
                          onChange={(e) => handlePlanningAreaChange(resource.id, e.target.value)}
                          placeholder="Enter planning area"
                          className="max-w-xs"
                          list={`planning-areas-${resource.id}`}
                          data-testid={`input-planning-area-${resource.id}`}
                        />
                        <datalist id={`planning-areas-${resource.id}`}>
                          {planningAreas.map(area => (
                            <option key={area} value={area} />
                          ))}
                        </datalist>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {resources.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          No resources found
        </div>
      )}
    </div>
  );
}
