import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock, XCircle, Settings, Play, Pause, Eye, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

interface AlgorithmVersion {
  id: number;
  algorithmName: string;
  version: string;
  displayName: string;
  description: string;
  algorithmType: string;
  category: string;
  developmentStatus: string;
  releaseNotes?: string;
  developedBy?: string;
  createdAt: string;
}

interface PlantAlgorithmApproval {
  id: number;
  plantId: number;
  algorithmVersionId: number;
  status: string;
  approvalLevel: string;
  approvedBy?: number;
  approvedAt?: string;
  approvalNotes?: string;
  effectiveDate?: string;
  expirationDate?: string;
  priority: number;
  plant: { name: string };
  algorithmVersion: AlgorithmVersion;
  approvedByUser?: { firstName: string; lastName: string };
}

interface AlgorithmDeployment {
  id: number;
  plantApprovalId: number;
  deploymentName: string;
  deploymentType: string;
  status: string;
  deployedAt?: string;
  lastRunAt?: string;
  healthStatus: string;
  runStatistics: {
    total_runs?: number;
    successful_runs?: number;
    failed_runs?: number;
  };
}

export default function AlgorithmGovernancePage() {
  const [selectedTab, setSelectedTab] = useState('versions');
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PlantAlgorithmApproval | null>(null);

  const queryClient = useQueryClient();

  // Fetch algorithm versions
  const { data: algorithmVersions = [] } = useQuery({
    queryKey: ['/api/algorithm-governance/versions'],
    queryFn: async () => {
      const response = await fetch('/api/algorithm-governance/versions');
      if (!response.ok) throw new Error('Failed to fetch algorithm versions');
      return response.json() as AlgorithmVersion[];
    },
  });

  // Fetch plant approvals
  const { data: plantApprovals = [] } = useQuery({
    queryKey: ['/api/algorithm-governance/approvals', selectedPlantId],
    queryFn: async () => {
      const url = selectedPlantId 
        ? `/api/algorithm-governance/approvals?plantId=${selectedPlantId}`
        : '/api/algorithm-governance/approvals';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch plant approvals');
      return response.json() as PlantAlgorithmApproval[];
    },
  });

  // Fetch deployments
  const { data: deployments = [] } = useQuery({
    queryKey: ['/api/algorithm-governance/deployments', selectedPlantId],
    queryFn: async () => {
      const url = selectedPlantId
        ? `/api/algorithm-governance/deployments?plantId=${selectedPlantId}`
        : '/api/algorithm-governance/deployments';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json() as AlgorithmDeployment[];
    },
  });

  // Fetch plants for filter
  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
    queryFn: async () => {
      const response = await fetch('/api/plants');
      if (!response.ok) throw new Error('Failed to fetch plants');
      return response.json();
    },
  });

  // Approve/reject algorithm mutation
  const approveAlgorithmMutation = useMutation({
    mutationFn: async ({ approvalId, action, notes }: { approvalId: number; action: string; notes?: string }) => {
      const response = await fetch(`/api/algorithm-governance/approvals/${approvalId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} algorithm`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithm-governance/approvals'] });
      setShowApprovalDialog(false);
      setSelectedApproval(null);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      suspended: { variant: 'outline' as const, icon: AlertCircle, color: 'text-gray-600' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      standard: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
      experimental: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={categoryColors[category as keyof typeof categoryColors] || categoryColors.standard}>
        {category}
      </Badge>
    );
  };

  const getHealthStatusIcon = (status: string) => {
    const healthIcons = {
      healthy: <CheckCircle className="h-4 w-4 text-green-600" />,
      warning: <AlertCircle className="h-4 w-4 text-yellow-600" />,
      critical: <XCircle className="h-4 w-4 text-red-600" />,
      unknown: <AlertCircle className="h-4 w-4 text-gray-400" />,
    };
    
    return healthIcons[status as keyof typeof healthIcons] || healthIcons.unknown;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Algorithm Governance</h1>
          <p className="text-gray-600">Manage algorithm versions and plant-specific deployments</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPlantId?.toString() || 'all'} onValueChange={(value) => setSelectedPlantId(value === 'all' ? null : parseInt(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by plant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plants</SelectItem>
              {plants.map((plant: any) => (
                <SelectItem key={plant.id} value={plant.id.toString()}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="versions">Algorithm Versions</TabsTrigger>
          <TabsTrigger value="approvals">Plant Approvals</TabsTrigger>
          <TabsTrigger value="deployments">Active Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {algorithmVersions.map((version) => (
              <Card key={version.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{version.displayName}</CardTitle>
                      <p className="text-sm text-gray-600">v{version.version}</p>
                    </div>
                    {getCategoryBadge(version.category)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{version.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{version.algorithmType}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Status:</span>
                      <Badge variant={version.developmentStatus === 'approved' ? 'default' : 'secondary'}>
                        {version.developmentStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Developed by:</span>
                      <span className="font-medium">{version.developedBy || 'System'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Released:</span>
                      <span className="font-medium">{format(new Date(version.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  {version.releaseNotes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600 font-medium mb-1">Release Notes:</p>
                      <p className="text-xs text-gray-500">{version.releaseNotes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="grid gap-4">
            {plantApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{approval.algorithmVersion.displayName}</h3>
                        <Badge variant="outline">v{approval.algorithmVersion.version}</Badge>
                        {getCategoryBadge(approval.algorithmVersion.category)}
                        {getStatusBadge(approval.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Plant:</span>
                          <p className="font-medium">{approval.plant.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Approval Level:</span>
                          <p className="font-medium">{approval.approvalLevel}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <p className="font-medium">{approval.priority}/10</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Effective Date:</span>
                          <p className="font-medium">
                            {approval.effectiveDate ? format(new Date(approval.effectiveDate), 'MMM dd, yyyy') : 'Not set'}
                          </p>
                        </div>
                      </div>

                      {approval.approvalNotes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 font-medium mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{approval.approvalNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {approval.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => { setSelectedApproval(approval); setShowApprovalDialog(true); }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <div className="grid gap-4">
            {deployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{deployment.deploymentName}</h3>
                        <Badge variant={deployment.deploymentType === 'production' ? 'default' : 'secondary'}>
                          {deployment.deploymentType}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getHealthStatusIcon(deployment.healthStatus)}
                          <span className="text-sm font-medium">{deployment.healthStatus}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium flex items-center gap-1">
                            {deployment.status === 'active' ? (
                              <Play className="h-3 w-3 text-green-600" />
                            ) : (
                              <Pause className="h-3 w-3 text-gray-400" />
                            )}
                            {deployment.status}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Deployed:</span>
                          <p className="font-medium">
                            {deployment.deployedAt ? format(new Date(deployment.deployedAt), 'MMM dd, yyyy') : 'Not deployed'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Run:</span>
                          <p className="font-medium">
                            {deployment.lastRunAt ? format(new Date(deployment.lastRunAt), 'MMM dd, HH:mm') : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Rate:</span>
                          <p className="font-medium">
                            {deployment.runStatistics.total_runs ? 
                              `${Math.round(((deployment.runStatistics.successful_runs || 0) / deployment.runStatistics.total_runs) * 100)}%` : 
                              'N/A'}
                          </p>
                        </div>
                      </div>

                      {deployment.runStatistics && (
                        <div className="pt-2 border-t">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-gray-500">Total Runs:</span>
                              <p className="font-medium">{deployment.runStatistics.total_runs || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Successful:</span>
                              <p className="font-medium text-green-600">{deployment.runStatistics.successful_runs || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Failed:</span>
                              <p className="font-medium text-red-600">{deployment.runStatistics.failed_runs || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant={deployment.status === 'active' ? 'secondary' : 'default'}>
                        {deployment.status === 'active' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Algorithm Approval</DialogTitle>
          </DialogHeader>
          
          {selectedApproval && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedApproval.algorithmVersion.displayName}</h4>
                <p className="text-sm text-gray-600">v{selectedApproval.algorithmVersion.version}</p>
                <p className="text-sm text-gray-600">For {selectedApproval.plant.name}</p>
              </div>
              
              <div>
                <Label htmlFor="approval-notes">Review Notes</Label>
                <Textarea 
                  id="approval-notes"
                  placeholder="Add your review comments..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => approveAlgorithmMutation.mutate({
                    approvalId: selectedApproval.id,
                    action: 'approve'
                  })}
                  disabled={approveAlgorithmMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => approveAlgorithmMutation.mutate({
                    approvalId: selectedApproval.id,
                    action: 'reject'
                  })}
                  disabled={approveAlgorithmMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}