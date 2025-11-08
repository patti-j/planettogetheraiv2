import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpIcon, ArrowDownIcon, SaveIcon, RefreshCwIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: number;
  name: string;
  description: string;
  deployment_order: number;
  plant_id: number;
  active: boolean;
}

export default function ResourceDeploymentOrder() {
  const { toast } = useToast();
  const [editedResources, setEditedResources] = useState<Record<number, number>>({});

  const { data: resources = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/ptresources'],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: number; deployment_order: number }[]) => {
      return apiRequest('/api/ptresources/update-deployment-order', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Deployment order updated successfully',
      });
      setEditedResources({});
      queryClient.invalidateQueries({ queryKey: ['/api/ptresources'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update deployment order',
        variant: 'destructive',
      });
    },
  });

  const handleOrderChange = (resourceId: number, newOrder: number) => {
    setEditedResources(prev => ({
      ...prev,
      [resourceId]: newOrder,
    }));
  };

  const moveResource = (index: number, direction: 'up' | 'down') => {
    const newResources = [...resources];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newResources.length) return;
    
    // Swap resources
    [newResources[index], newResources[targetIndex]] = [newResources[targetIndex], newResources[index]];
    
    // Update deployment orders
    const updates: Record<number, number> = {};
    newResources.forEach((resource, idx) => {
      const newOrder = (idx + 1) * 10;
      if (resource.deployment_order !== newOrder) {
        updates[resource.id] = newOrder;
      }
    });
    
    setEditedResources(updates);
  };

  const handleSave = () => {
    const updates = Object.entries(editedResources).map(([id, order]) => ({
      id: parseInt(id),
      deployment_order: order,
    }));
    
    if (updates.length > 0) {
      updateOrderMutation.mutate(updates);
    }
  };

  const handleReset = () => {
    setEditedResources({});
    refetch();
  };

  const getDisplayOrder = (resource: Resource) => {
    return editedResources[resource.id] ?? resource.deployment_order ?? 999;
  };

  const sortedResources = [...resources].sort((a, b) => 
    getDisplayOrder(a) - getDisplayOrder(b)
  );

  const hasChanges = Object.keys(editedResources).length > 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading resources...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resource Deployment Order Management</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updateOrderMutation.isPending}
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Resources are displayed in their deployment order. Use the arrows to reorder resources or edit the order value directly.
            Lower numbers appear first in the production scheduler.
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Order</TableHead>
                <TableHead>Resource Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResources.map((resource, index) => (
                <TableRow key={resource.id} className={editedResources[resource.id] ? 'bg-yellow-50' : ''}>
                  <TableCell>
                    <Input
                      type="number"
                      value={getDisplayOrder(resource)}
                      onChange={(e) => handleOrderChange(resource.id, parseInt(e.target.value) || 999)}
                      className="w-20"
                      min="1"
                      data-testid={`input-order-${resource.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {resource.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveResource(index, 'up')}
                        disabled={index === 0}
                        data-testid={`button-up-${resource.id}`}
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveResource(index, 'down')}
                        disabled={index === sortedResources.length - 1}
                        data-testid={`button-down-${resource.id}`}
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {resources.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No resources found. Create some resources first.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}