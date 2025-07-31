import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, Users, Settings, Database, Shield, Activity, 
  AlertTriangle, CheckCircle, Clock, RefreshCw, Eye,
  UserPlus, UserMinus, Upload, Download, Maximize2, Minimize2,
  HardDrive, Cpu, MemoryStick, Wifi, Globe, Lock
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemHealthMetric {
  id: number;
  metricName: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
  environment: string;
  timestamp: string;
}

interface SystemUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

interface SystemEnvironment {
  id: number;
  name: string;
  type: 'production' | 'staging' | 'development' | 'test';
  status: 'active' | 'maintenance' | 'offline';
  url?: string;
  description?: string;
  lastDeployment?: string;
}

interface SystemUpgrade {
  id: number;
  version: string;
  description: string;
  environment: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  scheduledAt: string;
  completedAt?: string;
  releaseNotes?: string;
}

export default function SystemsManagementPage() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [newUpgradeDialog, setNewUpgradeDialog] = useState(false);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('health');
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: ''
  });
  const [editUserData, setEditUserData] = useState({
    id: 0,
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    isActive: true
  });
  const { toast } = useToast();

  // System Health Data
  const { data: systemHealth = [], isLoading: healthLoading } = useQuery<SystemHealthMetric[]>({
    queryKey: ["/api/system/health", selectedEnvironment],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // System Users Data - fetch real users from API
  const { data: systemUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // System Environments Data
  const { data: environments = [], isLoading: environmentsLoading } = useQuery<SystemEnvironment[]>({
    queryKey: ["/api/system/environments"],
  });

  // System Upgrades Data
  const { data: upgrades = [], isLoading: upgradesLoading } = useQuery<SystemUpgrade[]>({
    queryKey: ["/api/system/upgrades", selectedEnvironment],
  });

  // Mock system health data for demonstration
  const mockHealthMetrics: SystemHealthMetric[] = [
    {
      id: 1,
      metricName: "CPU Usage",
      value: 45.2,
      unit: "%",
      status: 'healthy',
      threshold: 80,
      environment: 'production',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      metricName: "Memory Usage",
      value: 68.7,
      unit: "%",
      status: 'warning',
      threshold: 85,
      environment: 'production',
      timestamp: new Date().toISOString()
    },
    {
      id: 3,
      metricName: "Disk Usage",
      value: 34.1,
      unit: "%",
      status: 'healthy',
      threshold: 90,
      environment: 'production',
      timestamp: new Date().toISOString()
    },
    {
      id: 4,
      metricName: "Response Time",
      value: 142,
      unit: "ms",
      status: 'healthy',
      threshold: 500,
      environment: 'production',
      timestamp: new Date().toISOString()
    },
    {
      id: 5,
      metricName: "Active Connections",
      value: 234,
      unit: "connections",
      status: 'healthy',
      threshold: 1000,
      environment: 'production',
      timestamp: new Date().toISOString()
    }
  ];



  const mockEnvironments: SystemEnvironment[] = [
    {
      id: 1,
      name: "Production",
      type: 'production',
      status: 'active',
      url: "https://app.company.com",
      description: "Live production environment",
      lastDeployment: "2025-07-18T15:30:00Z"
    },
    {
      id: 2,
      name: "Staging",
      type: 'staging',
      status: 'active',
      url: "https://staging.company.com",
      description: "Pre-production testing environment",
      lastDeployment: "2025-07-19T10:15:00Z"
    },
    {
      id: 3,
      name: "Development",
      type: 'development',
      status: 'active',
      url: "https://dev.company.com",
      description: "Development environment",
      lastDeployment: "2025-07-20T09:00:00Z"
    },
    {
      id: 4,
      name: "Testing",
      type: 'test',
      status: 'maintenance',
      url: "https://test.company.com",
      description: "Automated testing environment",
      lastDeployment: "2025-07-17T14:20:00Z"
    }
  ];

  const mockUpgrades: SystemUpgrade[] = [
    {
      id: 1,
      version: "v2.4.1",
      description: "Security patches and performance improvements",
      environment: 'production',
      status: 'completed',
      scheduledAt: "2025-07-18T02:00:00Z",
      completedAt: "2025-07-18T02:45:00Z",
      releaseNotes: "Fixed critical security vulnerability, improved database performance"
    },
    {
      id: 2,
      version: "v2.5.0",
      description: "New features and UI improvements",
      environment: 'staging',
      status: 'in-progress',
      scheduledAt: "2025-07-20T01:00:00Z",
      releaseNotes: "Added new dashboard widgets, improved mobile responsiveness"
    },
    {
      id: 3,
      version: "v2.5.1",
      description: "Bug fixes and minor enhancements",
      environment: 'development',
      status: 'pending',
      scheduledAt: "2025-07-22T03:00:00Z",
      releaseNotes: "Fixed form validation issues, updated dependencies"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'completed':
        return 'bg-green-500';
      case 'warning':
      case 'maintenance':
      case 'in-progress':
        return 'bg-yellow-500';
      case 'critical':
      case 'offline':
      case 'failed':
      case 'suspended':
        return 'bg-red-500';
      case 'pending':
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/users"] });
      toast({
        title: "User Created",
        description: "New user has been successfully created."
      });
      setNewUserDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user.",
        variant: "destructive"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("PATCH", `/api/users/${userData.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Updated",
        description: "User has been successfully updated."
      });
      setEditUserDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive"
      });
    }
  });

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setViewUserDialog(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserData({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      isActive: user.isActive
    });
    setEditUserDialog(true);
  };

  const createUpgradeMutation = useMutation({
    mutationFn: async (upgradeData: any) => {
      const response = await apiRequest("POST", "/api/system/upgrades", upgradeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/upgrades"] });
      toast({
        title: "Upgrade Scheduled",
        description: "System upgrade has been scheduled successfully."
      });
      setNewUpgradeDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule upgrade.",
        variant: "destructive"
      });
    }
  });

  const PageContent = () => (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Server className="w-6 h-6 mr-2" />
            Systems Management
          </h1>
          <p className="text-sm md:text-base text-gray-600">Monitor system health, manage users, and oversee IT infrastructure</p>
        </div>
        

        
        {/* Controls positioned below header */}
        <div className="mt-4 flex justify-end">
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <p className="text-xs text-muted-foreground">uptime this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter(u => u.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">of {mockUsers.length} total users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Environments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEnvironments.filter(e => e.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">environments online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recent Upgrades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUpgrades.filter(u => u.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">completed this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-5 min-w-max">
            <TabsTrigger value="health" className="text-xs sm:text-sm whitespace-nowrap">Health</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">Users</TabsTrigger>
            <TabsTrigger value="environments" className="text-xs sm:text-sm whitespace-nowrap">Environments</TabsTrigger>
            <TabsTrigger value="upgrades" className="text-xs sm:text-sm whitespace-nowrap">Upgrades</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm whitespace-nowrap">Security</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time System Metrics
                </CardTitle>
                <CardDescription>
                  Live monitoring of system performance and resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockHealthMetrics.map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getHealthIcon(metric.status)}
                          <span className="font-medium">{metric.metricName}</span>
                        </div>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {metric.value} {metric.unit}
                      </div>
                      <Progress 
                        value={(metric.value / metric.threshold) * 100} 
                        className="h-2 mb-2" 
                      />
                      <p className="text-xs text-gray-600">
                        Threshold: {metric.threshold} {metric.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">System Users</h3>
            <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with appropriate permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John"
                        value={newUserData.firstName}
                        onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe"
                        value={newUserData.lastName}
                        onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="Enter username"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="user@company.com"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newUserData.role}
                      onValueChange={(value) => setNewUserData({...newUserData, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewUserDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      if (newUserData.username && newUserData.email && newUserData.firstName && 
                          newUserData.lastName && newUserData.password && newUserData.role) {
                        // Send user data with password (backend will handle hashing)
                        createUserMutation.mutate({
                          username: newUserData.username,
                          email: newUserData.email,
                          firstName: newUserData.firstName,
                          lastName: newUserData.lastName,
                          password: newUserData.password,
                          isActive: true
                        });
                        // Reset form data
                        setNewUserData({
                          username: '',
                          email: '',
                          firstName: '',
                          lastName: '',
                          password: '',
                          role: ''
                        });
                      } else {
                        toast({
                          title: "Error",
                          description: "Please fill in all fields.",
                          variant: "destructive"
                        });
                      }
                    }}>
                      Create User
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View User Dialog */}
            <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>User Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this user.
                  </DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Username</Label>
                        <p className="font-medium">{selectedUser.username}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Status</Label>
                        <Badge className={getStatusColor(selectedUser.isActive ? 'active' : 'inactive')}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">First Name</Label>
                        <p className="font-medium">{selectedUser.firstName || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Last Name</Label>
                        <p className="font-medium">{selectedUser.lastName || 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Role</Label>
                      <p className="font-medium">{selectedUser.activeRole?.name || selectedUser.roles?.[0]?.name || 'No Role'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Last Login</Label>
                      <p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Created</Label>
                      <p className="font-medium">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewUserDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      value={editUserData.username}
                      onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editUserData.email}
                      onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editUserData.firstName}
                        onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={editUserData.lastName}
                        onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editUserData.isActive ? 'active' : 'inactive'} onValueChange={(value) => setEditUserData({...editUserData, isActive: value === 'active'})}>
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditUserDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    updateUserMutation.mutate(editUserData);
                  }}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.activeRole?.name || user.roles?.[0]?.name || 'No Role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.isActive ? 'active' : 'inactive')}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewUser(user)}
                            title="View User Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environments" className="space-y-4">
          <div className="grid gap-4">
            {mockEnvironments.map((env) => (
              <Card key={env.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {env.name}
                      </CardTitle>
                      <CardDescription>{env.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{env.type}</Badge>
                      <Badge className={getStatusColor(env.status)}>
                        {env.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">URL:</span>
                      <p className="text-blue-600">{env.url}</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Deployment:</span>
                      <p>{env.lastDeployment ? new Date(env.lastDeployment).toLocaleString() : 'None'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Logs
                      </Button>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Deploy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upgrades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">System Upgrades</h3>
            <Dialog open={newUpgradeDialog} onOpenChange={setNewUpgradeDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Schedule Upgrade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule System Upgrade</DialogTitle>
                  <DialogDescription>
                    Plan a new system upgrade for deployment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input id="version" placeholder="e.g., v2.5.2" />
                  </div>
                  <div>
                    <Label htmlFor="upgrade-description">Description</Label>
                    <Textarea id="upgrade-description" placeholder="Brief description of the upgrade" />
                  </div>
                  <div>
                    <Label htmlFor="upgrade-environment">Environment</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewUpgradeDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast({
                        title: "Upgrade Scheduled",
                        description: "System upgrade has been scheduled successfully."
                      });
                      setNewUpgradeDialog(false);
                    }}>
                      Schedule Upgrade
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {mockUpgrades.map((upgrade) => (
              <Card key={upgrade.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{upgrade.version}</CardTitle>
                      <CardDescription>{upgrade.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{upgrade.environment}</Badge>
                      <Badge className={getStatusColor(upgrade.status)}>
                        {upgrade.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Scheduled:</span> {new Date(upgrade.scheduledAt).toLocaleString()}
                    </div>
                    {upgrade.completedAt && (
                      <div>
                        <span className="font-medium">Completed:</span> {new Date(upgrade.completedAt).toLocaleString()}
                      </div>
                    )}
                    {upgrade.releaseNotes && (
                      <div>
                        <span className="font-medium">Release Notes:</span>
                        <p className="mt-1 text-gray-600">{upgrade.releaseNotes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>SSL Certificate</span>
                  <Badge className="bg-green-500">Valid</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Firewall Status</span>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Security Scan</span>
                  <span className="text-sm text-gray-600">2 hours ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Failed Login Attempts</span>
                  <Badge variant="outline">3 today</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Two-Factor Authentication</span>
                  <Badge className="bg-green-500">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Password Policy</span>
                  <Badge className="bg-green-500">Strong</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Session Timeout</span>
                  <span className="text-sm text-gray-600">30 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Sessions</span>
                  <Badge variant="outline">12</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      {/* Maximize button in top right corner matching hamburger menu positioning */}
      <div className="fixed top-2 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {isMaximized ? (
        <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
          <PageContent />
        </div>
      ) : (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <PageContent />
        </div>
      )}
    </>
  );
}