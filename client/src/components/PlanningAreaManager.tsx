import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import type { PlanningArea, InsertPlanningArea } from '@shared/schema';

export default function PlanningAreaManager() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlanningArea, setSelectedPlanningArea] = useState<PlanningArea | null>(null);
  const [formData, setFormData] = useState<Partial<InsertPlanningArea>>({
    name: '',
    description: '',
    optimizationMethod: 'optimization_studio',
    isActive: true,
  });

  const { data: planningAreas = [], isLoading, refetch } = useQuery<PlanningArea[]>({
    queryKey: ['/api/planning-areas'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPlanningArea) => {
      return apiRequest('POST', '/api/planning-areas', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Planning area created successfully',
      });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', optimizationMethod: 'optimization_studio', isActive: true });
      queryClient.invalidateQueries({ queryKey: ['/api/planning-areas'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create planning area',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPlanningArea> }) => {
      return apiRequest('PATCH', `/api/planning-areas/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Planning area updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPlanningArea(null);
      queryClient.invalidateQueries({ queryKey: ['/api/planning-areas'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update planning area',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/planning-areas/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Planning area deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/planning-areas'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete planning area',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Planning area name is required',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData as InsertPlanningArea);
  };

  const handleEdit = (planningArea: PlanningArea) => {
    setSelectedPlanningArea(planningArea);
    setFormData({
      name: planningArea.name,
      description: planningArea.description || '',
      optimizationMethod: planningArea.optimizationMethod || 'optimization_studio',
      isActive: planningArea.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedPlanningArea || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Planning area name is required',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({ id: selectedPlanningArea.id, data: formData });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the planning area "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Planning Area Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure planning areas and their optimization methods
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create">
                <Plus className="h-4 w-4 mr-2" />
                Create Planning Area
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Planning Area</DialogTitle>
                <DialogDescription>
                  Create a new planning area with its optimization method
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Name *</Label>
                  <Input
                    id="create-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., North Plant, Packaging Line A"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea
                    id="create-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    data-testid="input-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-method">Optimization Method *</Label>
                  <Select
                    value={formData.optimizationMethod}
                    onValueChange={(value) => setFormData({ ...formData, optimizationMethod: value as any })}
                  >
                    <SelectTrigger id="create-method" data-testid="select-optimization-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="optimization_studio">Optimization Studio</SelectItem>
                      <SelectItem value="advanced_solver">Advanced Solver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="create-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                    data-testid="checkbox-active"
                  />
                  <Label htmlFor="create-active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({ name: '', description: '', optimizationMethod: 'optimization_studio', isActive: true });
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Optimization Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planningAreas.map((area) => (
                <TableRow key={area.id} data-testid={`row-planning-area-${area.id}`}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    {area.description || '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      area.optimizationMethod === 'optimization_studio'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {area.optimizationMethod === 'optimization_studio' ? 'Optimization Studio' : 'Advanced Solver'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      area.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {area.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(area)}
                        data-testid={`button-edit-${area.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(area.id, area.name)}
                        data-testid={`button-delete-${area.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {planningAreas.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          No planning areas found. Create one to get started.
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Planning Area</DialogTitle>
            <DialogDescription>
              Update planning area details and optimization method
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., North Plant, Packaging Line A"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                data-testid="input-edit-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-method">Optimization Method *</Label>
              <Select
                value={formData.optimizationMethod}
                onValueChange={(value) => setFormData({ ...formData, optimizationMethod: value as any })}
              >
                <SelectTrigger id="edit-method" data-testid="select-edit-optimization-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimization_studio">Optimization Studio</SelectItem>
                  <SelectItem value="advanced_solver">Advanced Solver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-edit-active"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedPlanningArea(null);
                setFormData({ name: '', description: '', optimizationMethod: 'optimization_studio', isActive: true });
              }}
              data-testid="button-edit-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-update"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
