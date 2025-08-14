import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Clock, Code, GitBranch, Play, Settings, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AlgorithmVersion {
  id: number;
  algorithmName: string;
  version: string;
  displayName: string;
  description?: string;
  category: string;
  algorithmType: string;
  developmentStatus: string;
  releaseDate?: string;
  deprecationDate?: string;
  features: string[];
  requirements?: {
    minMemoryMb: number;
    minCpuCores: number;
    supportedPlatforms: string[];
    dependencies: string[];
  };
  configuration?: {
    parameters: Array<{
      name: string;
      type: string;
      defaultValue: any;
      description?: string;
      required: boolean;
    }>;
  };
  performanceMetrics?: {
    averageExecutionTimeMs: number;
    memoryUsageMb: number;
    successRate: number;
    lastBenchmarkDate: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlantAlgorithmDeployment {
  id: number;
  plantId: number;
  algorithmVersionId: number;
  deploymentStatus: string;
  approvalLevel: string;
  approvedBy?: number;
  approvalDate?: string;
  deployedDate?: string;
  isDefault: boolean;
  priority: number;
  plant?: { id: number; name: string };
  algorithmVersion?: AlgorithmVersion;
}

interface Plant {
  id: number;
  name: string;
  location: string;
}

export default function AlgorithmManagement() {
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('deployed');
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AlgorithmVersion | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's accessible plants
  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });

  // Get algorithm versions
  const { data: algorithmVersions = [] } = useQuery<AlgorithmVersion[]>({
    queryKey: ['/api/algorithm-versions'],
  });

  // Get plant algorithm deployments
  const { data: deployments = [] } = useQuery<PlantAlgorithmDeployment[]>({
    queryKey: ['/api/plant-algorithm-deployments', selectedPlant],
    enabled: !!selectedPlant,
  });

  // Set default plant on load
  useEffect(() => {
    if (plants.length > 0 && !selectedPlant) {
      setSelectedPlant(plants[0].id);
    }
  }, [plants, selectedPlant]);

  // Deploy algorithm mutation
  const deployAlgorithmMutation = useMutation({
    mutationFn: async (data: { plantId: number; algorithmVersionId: number; isDefault?: boolean; priority?: number }) => {
      const response = await fetch('/api/plant-algorithm-deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to deploy algorithm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plant-algorithm-deployments'] });
      toast({ title: 'Success', description: 'Algorithm deployment request submitted for approval' });
      setIsDeployDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Approve deployment mutation
  const approveDeploymentMutation = useMutation({
    mutationFn: async (data: { deploymentId: number; approved: boolean; comments?: string }) => {
      const response = await fetch(`/api/plant-algorithm-deployments/${data.deploymentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: data.approved, comments: data.comments }),
      });
      if (!response.ok) throw new Error('Failed to approve deployment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plant-algorithm-deployments'] });
      toast({ title: 'Success', description: 'Deployment approval updated' });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'approved':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'scheduling':
        return <Clock className="h-4 w-4" />;
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      case 'resource_allocation':
        return <Settings className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const filteredDeployments = deployments.filter(deployment => {
    if (activeTab === 'deployed') return deployment.deploymentStatus === 'deployed';
    if (activeTab === 'pending') return deployment.deploymentStatus === 'pending';
    if (activeTab === 'approved') return deployment.deploymentStatus === 'approved';
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Algorithm Management</h1>
          <p className="text-muted-foreground">
            Manage algorithm versions and plant-specific deployments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select 
            value={selectedPlant?.toString() || ''} 
            onValueChange={(value) => setSelectedPlant(parseInt(value))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select plant..." />
            </SelectTrigger>
            <SelectContent>
              {plants.map(plant => (
                <SelectItem key={plant.id} value={plant.id.toString()}>
                  {plant.name} - {plant.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Deploy Algorithm
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deploy Algorithm to Plant</DialogTitle>
                <DialogDescription>
                  Select an algorithm version to deploy to the selected plant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Algorithm Version</Label>
                  <Select onValueChange={(value) => {
                    const version = algorithmVersions.find(v => v.id.toString() === value);
                    setSelectedVersion(version || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select algorithm version..." />
                    </SelectTrigger>
                    <SelectContent>
                      {algorithmVersions
                        .filter(v => v.developmentStatus === 'production' && v.isActive)
                        .map(version => (
                          <SelectItem key={version.id} value={version.id.toString()}>
                            {version.displayName} v{version.version}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedVersion && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(selectedVersion.category)}
                      <span className="font-medium">{selectedVersion.displayName}</span>
                      <Badge variant="outline">v{selectedVersion.version}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{selectedVersion.description}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">{selectedVersion.category}</Badge>
                      <Badge variant="outline">{selectedVersion.algorithmType}</Badge>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedVersion && selectedPlant) {
                      deployAlgorithmMutation.mutate({
                        plantId: selectedPlant,
                        algorithmVersionId: selectedVersion.id,
                        priority: 100
                      });
                    }
                  }}
                  disabled={!selectedVersion || deployAlgorithmMutation.isPending}
                >
                  Submit for Approval
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Algorithm Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Algorithm Library
          </CardTitle>
          <CardDescription>
            Available algorithm versions and their specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {algorithmVersions.map(version => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(version.category)}
                      <div>
                        <h4 className="font-semibold">{version.displayName}</h4>
                        <p className="text-sm text-gray-500">v{version.version}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(version.developmentStatus)}>
                      {version.developmentStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {version.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {version.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {version.algorithmType}
                    </Badge>
                  </div>
                  {version.performanceMetrics && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Avg Runtime: {version.performanceMetrics.averageExecutionTimeMs}ms</div>
                      <div>Success Rate: {version.performanceMetrics.successRate}%</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plant Deployments */}
      {selectedPlant && (
        <Card>
          <CardHeader>
            <CardTitle>
              Plant Algorithm Deployments
            </CardTitle>
            <CardDescription>
              Algorithm versions deployed to {plants.find(p => p.id === selectedPlant)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="deployed">Deployed</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Algorithm</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deployed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeployments.map(deployment => (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {deployment.algorithmVersion && getCategoryIcon(deployment.algorithmVersion.category)}
                            <div>
                              <div className="font-medium">
                                {deployment.algorithmVersion?.displayName}
                              </div>
                              {deployment.isDefault && (
                                <Badge variant="outline" className="text-xs">Default</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            v{deployment.algorithmVersion?.version}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {deployment.algorithmVersion?.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deployment.deploymentStatus)}
                            <Badge className={getStatusColor(deployment.deploymentStatus)}>
                              {deployment.deploymentStatus}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{deployment.priority}</TableCell>
                        <TableCell>
                          {deployment.deployedDate ? 
                            format(new Date(deployment.deployedDate), 'MMM d, yyyy') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {deployment.deploymentStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approveDeploymentMutation.mutate({
                                    deploymentId: deployment.id,
                                    approved: true
                                  })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approveDeploymentMutation.mutate({
                                    deploymentId: deployment.id,
                                    approved: false
                                  })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}