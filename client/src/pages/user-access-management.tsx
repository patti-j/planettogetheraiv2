import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Shield, Key, Plus, Edit, Trash2, Eye, Settings,
  CheckCircle, AlertCircle, UserPlus, Search, ChevronDown,
  ChevronRight, UserCheck, Lock, Copy
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  roles?: Role[];
  activeRole?: Role;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  userCount?: number;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: number;
  name: string;
  feature: string;
  action: string;
  description: string;
}

interface FeaturePermissions {
  feature: string;
  permissions: Permission[];
}

export default function UserAccessManagementPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  
  // User management states
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleIds: [] as number[]
  });
  const [editUserData, setEditUserData] = useState({
    id: 0,
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
    roleIds: [] as number[]
  });

  // Role management states
  const [newRoleDialog, setNewRoleDialog] = useState(false);
  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as number[]
  });
  
  // Permission management states
  const [editPermissionDialog, setEditPermissionDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [permissionRoleIds, setPermissionRoleIds] = useState<number[]>([]);

  const { toast } = useToast();
  const { aiTheme } = useAITheme();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles-management"],
  });

  // Fetch permissions grouped by feature
  const { data: permissionsByFeature = [], isLoading: permissionsLoading } = useQuery<FeaturePermissions[]>({
    queryKey: ["/api/permissions/grouped"],
  });

  // Get all available features and permissions
  const features = permissionsByFeature.map(fp => fp.feature);
  const allPermissions = permissionsByFeature.flatMap(fp => fp.permissions);

  // Filter functions
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = selectedFeature === 'all' 
    ? permissionsByFeature 
    : permissionsByFeature.filter(fp => fp.feature === selectedFeature);

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully",
      });
      setNewUserDialog(false);
      setNewUserData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        roleIds: []
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof editUserData) => {
      const response = await apiRequest("PUT", `/api/users/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been updated successfully",
      });
      setEditUserDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Role mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof roleForm) => {
      const response = await apiRequest("POST", "/api/roles-management", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Created",
        description: "New role has been created successfully",
      });
      setNewRoleDialog(false);
      setRoleForm({ name: "", description: "", permissions: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number } & typeof roleForm) => {
      const response = await apiRequest("PATCH", `/api/roles-management/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Role has been updated successfully",
      });
      setEditRoleDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditUserData({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      isActive: user.isActive,
      roleIds: user.roles?.map(r => r.id) || []
    });
    setEditUserDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(p => p.id)
    });
    setEditRoleDialog(true);
  };

  const toggleFeatureExpansion = (feature: string) => {
    setExpandedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const togglePermission = (permissionId: number) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const selectAllPermissions = () => {
    setRoleForm(prev => ({
      ...prev,
      permissions: allPermissions.map(p => p.id)
    }));
  };

  const unselectAllPermissions = () => {
    setRoleForm(prev => ({
      ...prev,
      permissions: []
    }));
  };
  
  const handleEditPermissionRoles = (permission: Permission, rolesWithPermission: Role[]) => {
    setSelectedPermission(permission);
    setPermissionRoleIds(rolesWithPermission.map(r => r.id));
    setEditPermissionDialog(true);
  };
  
  const updatePermissionRolesMutation = useMutation({
    mutationFn: async (data: { permissionId: number, roleIds: number[] }) => {
      // Update each role's permissions
      const updatePromises = roles.map(async (role) => {
        const shouldHavePermission = data.roleIds.includes(role.id);
        const hasPermission = role.permissions.some(p => p.id === data.permissionId);
        
        if (shouldHavePermission && !hasPermission) {
          // Add permission to role
          const updatedPermissions = [...role.permissions.map(p => p.id), data.permissionId];
          const response = await apiRequest("PATCH", `/api/roles-management/${role.id}`, {
            permissions: updatedPermissions
          });
          return response.json();
        } else if (!shouldHavePermission && hasPermission) {
          // Remove permission from role
          const updatedPermissions = role.permissions.filter(p => p.id !== data.permissionId).map(p => p.id);
          const response = await apiRequest("PATCH", `/api/roles-management/${role.id}`, {
            permissions: updatedPermissions
          });
          return response.json();
        }
      });
      
      await Promise.all(updatePromises.filter(Boolean));
    },
    onSuccess: () => {
      toast({
        title: "Permissions Updated",
        description: "Role assignments have been updated successfully",
      });
      setEditPermissionDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role assignments",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            User & Access Management
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions in one place
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Users</CardTitle>
                  <CardDescription>Manage user accounts and their role assignments</CardDescription>
                </div>
                <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className={aiTheme ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : ""}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Add a new user to the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newUserData.username}
                          onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                          placeholder="johndoe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={newUserData.firstName}
                            onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={newUserData.lastName}
                            onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <Label>Assign Roles</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                          {roles.map((role) => (
                            <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                              <Checkbox
                                checked={newUserData.roleIds.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewUserData({...newUserData, roleIds: [...newUserData.roleIds, role.id]});
                                  } else {
                                    setNewUserData({...newUserData, roleIds: newUserData.roleIds.filter(id => id !== role.id)});
                                  }
                                }}
                              />
                              <span className="text-sm">{role.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewUserDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        if (newUserData.username && newUserData.email && newUserData.password) {
                          createUserMutation.mutate(newUserData);
                        } else {
                          toast({
                            title: "Error",
                            description: "Please fill in all required fields",
                            variant: "destructive"
                          });
                        }
                      }}>
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Loading users...</TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.firstName} {user.lastName}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles?.map((role) => (
                                <Badge key={role.id} variant="outline" className="text-xs">
                                  {role.name}
                                </Badge>
                              )) || <span className="text-gray-400">No roles</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewUser(user)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Roles</CardTitle>
                  <CardDescription>Define roles and their associated permissions</CardDescription>
                </div>
                <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className={aiTheme ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : ""}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>Define a new role with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                          placeholder="e.g., Sales Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="roleDescription">Description</Label>
                        <Textarea
                          id="roleDescription"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                          placeholder="Describe the role's responsibilities..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Permissions</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={selectAllPermissions}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={unselectAllPermissions}
                            >
                              Unselect All
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md p-3 space-y-3 max-h-96 overflow-y-auto">
                          {permissionsByFeature.map((featureGroup) => (
                            <div key={featureGroup.feature} className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                {featureGroup.feature}
                              </h4>
                              <div className="space-y-1 pl-4">
                                {featureGroup.permissions.map((permission) => (
                                  <label key={permission.id} className="flex items-center space-x-2 cursor-pointer py-1">
                                    <Checkbox
                                      checked={roleForm.permissions.includes(permission.id)}
                                      onCheckedChange={() => togglePermission(permission.id)}
                                    />
                                    <div className="flex-1">
                                      <span className="text-sm font-medium">{permission.name}</span>
                                      <p className="text-xs text-gray-500">{permission.description}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewRoleDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        if (roleForm.name && roleForm.description) {
                          createRoleMutation.mutate(roleForm);
                        } else {
                          toast({
                            title: "Error",
                            description: "Please fill in all fields",
                            variant: "destructive"
                          });
                        }
                      }}>
                        Create Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid gap-4">
                {rolesLoading ? (
                  <p className="text-center text-gray-500">Loading roles...</p>
                ) : filteredRoles.length === 0 ? (
                  <p className="text-center text-gray-500">No roles found</p>
                ) : (
                  filteredRoles.map((role) => (
                    <Card key={role.id} className={role.isSystemRole ? "border-gray-300 bg-gray-50" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{role.name}</CardTitle>
                            {role.isSystemRole && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                System Role
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {role.userCount || 0} users
                            </Badge>
                            {!role.isSystemRole && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRole(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Permissions ({role.permissions.length})</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedRoles(prev => 
                                prev.includes(role.id) 
                                  ? prev.filter(id => id !== role.id)
                                  : [...prev, role.id]
                              )}
                            >
                              {selectedRoles.includes(role.id) ? (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="h-4 w-4 mr-1" />
                                  Show
                                </>
                              )}
                            </Button>
                          </div>
                          {selectedRoles.includes(role.id) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {role.permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center gap-2 text-sm text-gray-600">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>{permission.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Permissions</CardTitle>
                  <CardDescription>View all available permissions grouped by feature</CardDescription>
                </div>
                <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by feature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Features</SelectItem>
                    {features.map((feature) => (
                      <SelectItem key={feature} value={feature}>
                        {feature}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissionsLoading ? (
                  <p className="text-center text-gray-500">Loading permissions...</p>
                ) : filteredPermissions.length === 0 ? (
                  <p className="text-center text-gray-500">No permissions found</p>
                ) : (
                  filteredPermissions.map((featureGroup) => (
                    <div key={featureGroup.feature} className="border rounded-lg">
                      <button
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleFeatureExpansion(featureGroup.feature)}
                      >
                        <div className="flex items-center gap-2">
                          <Key className="h-5 w-5 text-gray-500" />
                          <h3 className="font-medium text-left">{featureGroup.feature}</h3>
                          <Badge variant="secondary">{featureGroup.permissions.length} permissions</Badge>
                        </div>
                        {expandedFeatures.includes(featureGroup.feature) ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFeatures.includes(featureGroup.feature) && (
                        <div className="px-4 pb-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Permission</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Roles with this Permission</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {featureGroup.permissions.map((permission) => {
                                // Find which roles have this permission
                                const rolesWithPermission = roles.filter(role => 
                                  role.permissions.some(p => p.id === permission.id)
                                );
                                
                                return (
                                  <TableRow key={permission.id}>
                                    <TableCell className="font-medium">{permission.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {permission.action}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                      {permission.description}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-wrap gap-1">
                                          {rolesWithPermission.map(role => (
                                            <Badge 
                                              key={role.id} 
                                              variant={role.isSystemRole ? "secondary" : "outline"}
                                              className="text-xs"
                                            >
                                              {role.name}
                                            </Badge>
                                          ))}
                                          {rolesWithPermission.length === 0 && (
                                            <span className="text-xs text-gray-400">No roles assigned</span>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditPermissionRoles(permission, rolesWithPermission)}
                                          title="Edit role assignments"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed information about this user</DialogDescription>
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
                  <Badge className={selectedUser.isActive ? 'bg-green-500' : 'bg-gray-500'}>
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
                <Label className="text-sm text-muted-foreground">Roles</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedUser.roles?.map((role) => (
                    <Badge key={role.id} variant="outline">
                      {role.name}
                    </Badge>
                  )) || <span className="text-gray-400">No roles assigned</span>}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Login</Label>
                <p className="font-medium">
                  {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Created</Label>
                <p className="font-medium">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
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
            <DialogDescription>Update user information and role assignments</DialogDescription>
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
              <Select 
                value={editUserData.isActive ? 'active' : 'inactive'} 
                onValueChange={(value) => setEditUserData({...editUserData, isActive: value === 'active'})}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign Roles</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={editUserData.roleIds.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditUserData({...editUserData, roleIds: [...editUserData.roleIds, role.id]});
                        } else {
                          setEditUserData({...editUserData, roleIds: editUserData.roleIds.filter(id => id !== role.id)});
                        }
                      }}
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateUserMutation.mutate(editUserData)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-roleName">Role Name</Label>
              <Input
                id="edit-roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-roleDescription">Description</Label>
              <Textarea
                id="edit-roleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectAllPermissions}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={unselectAllPermissions}
                  >
                    Unselect All
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-3 space-y-3 max-h-96 overflow-y-auto">
                {permissionsByFeature.map((featureGroup) => (
                  <div key={featureGroup.feature} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {featureGroup.feature}
                    </h4>
                    <div className="space-y-1 pl-4">
                      {featureGroup.permissions.map((permission) => (
                        <label key={permission.id} className="flex items-center space-x-2 cursor-pointer py-1">
                          <Checkbox
                            checked={roleForm.permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{permission.name}</span>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedRole && roleForm.name && roleForm.description) {
                updateRoleMutation.mutate({
                  id: selectedRole.id,
                  ...roleForm
                });
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Roles Dialog */}
      <Dialog open={editPermissionDialog} onOpenChange={setEditPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role Assignments</DialogTitle>
            <DialogDescription>
              Choose which roles should have the "{selectedPermission?.name}" permission
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <p className="font-medium text-sm">{selectedPermission.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {selectedPermission.feature} - {selectedPermission.action}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {selectedPermission.description}
                </p>
              </div>
              <div>
                <Label>Assign to Roles</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={permissionRoleIds.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPermissionRoleIds([...permissionRoleIds, role.id]);
                          } else {
                            setPermissionRoleIds(permissionRoleIds.filter(id => id !== role.id));
                          }
                        }}
                        disabled={role.isSystemRole}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{role.name}</span>
                        {role.isSystemRole && (
                          <span className="text-xs text-gray-500 ml-2">(System Role)</span>
                        )}
                        <p className="text-xs text-gray-600">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermissionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedPermission) {
                  updatePermissionRolesMutation.mutate({
                    permissionId: selectedPermission.id,
                    roleIds: permissionRoleIds
                  });
                }
              }}
              disabled={updatePermissionRolesMutation.isPending}
            >
              {updatePermissionRolesMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}