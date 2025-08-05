import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNavigation } from '@/contexts/NavigationContext';
import { Plus, Users, Database, Activity, Settings, Building, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  databaseUrl: string;
  status: 'active' | 'inactive' | 'suspended' | 'provisioning';
  plan: 'starter' | 'professional' | 'enterprise';
  maxUsers: number;
  maxFactories: number;
  features: string[];
  customConfig: any;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  storageUsed: number;
  planDistribution: {
    starter: number;
    professional: number;
    enterprise: number;
  };
}

interface TenantHealth {
  status: 'healthy' | 'degraded' | 'offline';
  database: boolean;
  lastAccess: string | null;
  metrics: {
    storageUsed: number;
    activeUsers: number;
    dailyTransactions: number;
  };
}

export default function TenantAdminPage() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addRecentPage } = useNavigation();

  // Add this page to recent pages when component mounts
  useEffect(() => {
    addRecentPage('/tenant-admin', 'Tenant Administration', 'Settings');
  }, [addRecentPage]);

  // Fetch tenant statistics
  const { data: stats, isLoading: statsLoading } = useQuery<TenantStats>({
    queryKey: ['/api/tenant-admin/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch all tenants
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/tenant-admin/tenants'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch tenant health for selected tenant
  const { data: tenantHealth } = useQuery<TenantHealth>({
    queryKey: ['/api/tenant-admin/tenants', selectedTenant?.id, 'health'],
    enabled: !!selectedTenant,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/tenant-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/stats'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Tenant Created",
        description: "New tenant has been successfully created and provisioned."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'professional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'starter':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="md:ml-12 ml-0">
          <h1 className="text-2xl md:text-3xl font-bold">Tenant Administration</h1>
          <p className="text-muted-foreground mt-1">
            Manage multi-tenant infrastructure and customer accounts
          </p>
        </div>
        <CreateTenantDialog 
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={(data) => createTenantMutation.mutate(data)}
          isLoading={createTenantMutation.isPending}
        />
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTenants || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes((stats?.storageUsed || 0) * 1024 * 1024)}</div>
            <p className="text-xs text-muted-foreground">
              Database storage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.planDistribution?.enterprise || 0}</div>
            <p className="text-xs text-muted-foreground">
              Premium customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Tenant Management</TabsTrigger>
          <TabsTrigger value="health">Health Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Directory</CardTitle>
              <CardDescription>
                Manage customer tenants and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <div className="text-center py-8">Loading tenants...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants?.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tenant.subdomain}.planettogether.com
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlanColor(tenant.plan)}>
                            {tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tenant.status)}
                            <span className="capitalize">{tenant.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            0 / {tenant.maxUsers}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tenant.features.slice(0, 2).map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature.replace('-', ' ')}
                              </Badge>
                            ))}
                            {tenant.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{tenant.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTenant(tenant)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants?.map((tenant) => (
              <TenantHealthCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tenant Details Dialog */}
      {selectedTenant && (
        <TenantDetailsDialog
          tenant={selectedTenant}
          health={tenantHealth}
          isOpen={!!selectedTenant}
          onOpenChange={() => setSelectedTenant(null)}
        />
      )}
    </div>
  );
}

function CreateTenantDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'professional',
    adminEmail: '',
    adminPassword: '',
    features: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const planFeatures = {
    starter: ['basic-scheduling', 'inventory-tracking'],
    professional: ['basic-scheduling', 'inventory-management', 'quality-tracking'],
    enterprise: ['advanced-scheduling', 'quality-management', 'inventory-optimization', 'analytics']
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      features: planFeatures[prev.plan as keyof typeof planFeatures] || []
    }));
  }, [formData.plan]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>
            Add a new manufacturing customer to the platform
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ACME Manufacturing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={formData.subdomain}
              onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
              placeholder="acme-manufacturing"
              required
            />
            <p className="text-xs text-muted-foreground">
              Will be accessible at {formData.subdomain}.planettogether.com
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
              placeholder="admin@acme.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Temporary Password</Label>
            <Input
              id="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
              placeholder="TempPass123!"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Included Features</Label>
            <div className="flex flex-wrap gap-1">
              {formData.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TenantDetailsDialog({ 
  tenant, 
  health, 
  isOpen, 
  onOpenChange 
}: {
  tenant: Tenant;
  health?: TenantHealth;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'professional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'starter':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tenant.name}</DialogTitle>
          <DialogDescription>
            Tenant ID: {tenant.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(tenant.status)}
                <span className="capitalize">{tenant.status}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Plan</Label>
              <Badge className={`mt-1 ${getPlanColor(tenant.plan)}`}>
                {tenant.plan}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Subdomain</Label>
              <p className="text-sm mt-1">{tenant.subdomain}.planettogether.com</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Database</Label>
              <p className="text-xs mt-1 font-mono">{tenant.databaseUrl}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Max Users</Label>
              <p className="text-sm mt-1">{tenant.maxUsers}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Max Factories</Label>
              <p className="text-sm mt-1">{tenant.maxFactories}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Features</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tenant.features.map((feature) => (
                <Badge key={feature} variant="outline">
                  {feature.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {health && (
            <div>
              <Label className="text-sm font-medium">Health Metrics</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold">{health.metrics.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold">{formatBytes(health.metrics.storageUsed * 1024 * 1024)}</div>
                    <p className="text-xs text-muted-foreground">Storage Used</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold">{health.metrics.dailyTransactions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Daily Transactions</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="mt-1">{new Date(tenant.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="mt-1">{new Date(tenant.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TenantHealthCard({ tenant }: { tenant: Tenant }) {
  const { data: health } = useQuery<TenantHealth>({
    queryKey: ['/api/tenant-admin/tenants', tenant.id, 'health'],
    refetchInterval: 5000
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm">{tenant.name}</span>
          {health && (
            <div className="flex items-center gap-2">
              {getStatusIcon(health.status)}
              <span className="text-xs capitalize">{health.status}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {health ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Active Users:</span>
                <div className="font-medium">{health.metrics.activeUsers}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Storage:</span>
                <div className="font-medium">{formatBytes(health.metrics.storageUsed * 1024 * 1024)}</div>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Daily Transactions:</span>
              <div className="font-medium">{health.metrics.dailyTransactions.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Database className="h-3 w-3" />
              <span className={health.database ? 'text-green-600' : 'text-red-600'}>
                Database {health.database ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Loading health data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}