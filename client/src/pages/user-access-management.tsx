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
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
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
  const [deleteRoleDialog, setDeleteRoleDialog] = useState(false);
  const [viewRoleUsersDialog, setViewRoleUsersDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as number[]
  });
  const [roleUserIds, setRoleUserIds] = useState<number[]>([]);
  
  // Permission management states
  const [newPermissionDialog, setNewPermissionDialog] = useState(false);
  const [editPermissionDialog, setEditPermissionDialog] = useState(false);
  const [editPermissionDetailsDialog, setEditPermissionDetailsDialog] = useState(false);
  const [deletePermissionDialog, setDeletePermissionDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [permissionRoleIds, setPermissionRoleIds] = useState<number[]>([]);
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    feature: '',
    action: '',
    description: ''
  });

  const { toast } = useToast();
  const { aiTheme } = useAITheme();

  // Fetch users with roles
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users-with-roles"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/users-with-roles"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/users-with-roles"] });
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
      setDeleteUserDialog(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users-with-roles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await apiRequest("DELETE", `/api/roles-management/${roleId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Deleted",
        description: "Role has been deleted successfully",
      });
      setDeleteRoleDialog(false);
      setSelectedRole(null);
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  // Permission mutations
  const createPermissionMutation = useMutation({
    mutationFn: async (data: typeof permissionForm) => {
      const response = await apiRequest("POST", "/api/permissions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permission Created",
        description: "New permission has been created successfully",
      });
      setNewPermissionDialog(false);
      setPermissionForm({ name: '', feature: '', action: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/grouped"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create permission",
        variant: "destructive",
      });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async (data: { id: number } & typeof permissionForm) => {
      const response = await apiRequest("PUT", `/api/permissions/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permission Updated",
        description: "Permission has been updated successfully",
      });
      setEditPermissionDetailsDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/grouped"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permission",
        variant: "destructive",
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId: number) => {
      const response = await apiRequest("DELETE", `/api/permissions/${permissionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permission Deleted",
        description: "Permission has been deleted successfully",
      });
      setDeletePermissionDialog(false);
      setSelectedPermission(null);
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/grouped"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete permission",
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

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteUserDialog(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystemRole) {
      toast({
        title: "Cannot Delete",
        description: "System roles cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
    if (role.userCount && role.userCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `Role is assigned to ${role.userCount} users. Remove users from this role first.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedRole(role);
    setDeleteRoleDialog(true);
  };

  const handleEditPermissionDetails = (permission: Permission) => {
    setSelectedPermission(permission);
    setPermissionForm({
      name: permission.name,
      feature: permission.feature,
      action: permission.action,
      description: permission.description
    });
    setEditPermissionDetailsDialog(true);
  };

  const handleDeletePermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setDeletePermissionDialog(true);
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

  const handleViewRoleUsers = (role: Role) => {
    setSelectedRole(role);
    // Get all users with this role
    const usersWithRole = users.filter(user => 
      user.roles?.some(userRole => userRole.id === role.id)
    );
    setRoleUserIds(usersWithRole.map(u => u.id));
    setViewRoleUsersDialog(true);
  };
  
  const updateRoleUsersMutation = useMutation({
    mutationFn: async (data: { roleId: number, userIds: number[] }) => {
      // Update each user's roles
      const updatePromises = users.map(async (user) => {
        const shouldHaveRole = data.userIds.includes(user.id);
        const hasRole = user.roles?.some(r => r.id === data.roleId);
        
        if (shouldHaveRole && !hasRole) {
          // Add role to user
          const updatedRoleIds = [...(user.roles?.map(r => r.id) || []), data.roleId];
          const response = await apiRequest("PUT", `/api/users/${user.id}`, {
            ...user,
            roleIds: updatedRoleIds
          });
          return response.json();
        } else if (!shouldHaveRole && hasRole) {
          // Remove role from user
          const updatedRoleIds = (user.roles || []).filter(r => r.id !== data.roleId).map(r => r.id);
          const response = await apiRequest("PUT", `/api/users/${user.id}`, {
            ...user,
            roleIds: updatedRoleIds
          });
          return response.json();
        }
      });
      
      await Promise.all(updatePromises);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Role Users Updated",
        description: "Users for this role have been updated successfully",
      });
      setViewRoleUsersDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role users",
        variant: "destructive",
      });
    },
  });

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
          <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center">
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
                  <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Add a new user to the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newUserData.username}
                          onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                          placeholder="johndoe"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                          placeholder="john@example.com"
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={newUserData.firstName}
                            onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                            placeholder="John"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={newUserData.lastName}
                            onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                            placeholder="Doe"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                          placeholder="••••••••"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assign Roles</Label>
                        <div className="border rounded-md p-3 space-y-3 max-h-48 overflow-y-auto">
                          {roles.map((role) => (
                            <label key={role.id} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                checked={newUserData.roleIds.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewUserData({...newUserData, roleIds: [...newUserData.roleIds, role.id]});
                                  } else {
                                    setNewUserData({...newUserData, roleIds: newUserData.roleIds.filter(id => id !== role.id)});
                                  }
                                }}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium">{role.name}</span>
                                {role.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{role.description.slice(0, 50)}...</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setNewUserDialog(false)} className="w-full sm:w-auto">
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
                      }} className="w-full sm:w-auto">
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
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
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
                  <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>Define a new role with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                          placeholder="e.g., Sales Manager"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">Description</Label>
                        <Textarea
                          id="roleDescription"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                          placeholder="Describe the role's responsibilities..."
                          rows={3}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <Label>Permissions</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={selectAllPermissions}
                              className="text-xs"
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={unselectAllPermissions}
                              className="text-xs"
                            >
                              Unselect All
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md p-3 space-y-3 max-h-[40vh] sm:max-h-96 overflow-y-auto">
                          {permissionsByFeature.map((featureGroup) => (
                            <div key={featureGroup.feature} className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800 py-1">
                                {featureGroup.feature}
                              </h4>
                              <div className="space-y-2 pl-2 sm:pl-4">
                                {featureGroup.permissions.map((permission) => (
                                  <label key={permission.id} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <Checkbox
                                      checked={roleForm.permissions.includes(permission.id)}
                                      onCheckedChange={() => togglePermission(permission.id)}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 space-y-0.5">
                                      <span className="text-sm font-medium block">{permission.name}</span>
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
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setNewRoleDialog(false)} className="w-full sm:w-auto">
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
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              {role.isSystemRole && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  System Role
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewRoleUsers(role)}
                                className="text-xs"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                {role.userCount || 0} users
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRole(role)}
                                title="Edit Role"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRole(role)}
                                title="Delete Role"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                          <CardDescription className="text-sm">{role.description}</CardDescription>
                        </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 p-3 bg-gray-50 rounded-md">
                              {role.permissions.map((permission) => (
                                <div key={permission.id} className="flex items-start gap-2 text-sm text-gray-600 p-1">
                                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="break-words">{permission.name}</span>
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle>System Permissions</CardTitle>
                  <CardDescription>View all available permissions grouped by feature</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  <Dialog open={newPermissionDialog} onOpenChange={setNewPermissionDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className={`${aiTheme ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : ""} w-full sm:w-auto`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Permission
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>Create New Permission</DialogTitle>
                        <DialogDescription>Define a new permission for the system</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="permissionName">Permission Name</Label>
                          <Input
                            id="permissionName"
                            value={permissionForm.name}
                            onChange={(e) => setPermissionForm({...permissionForm, name: e.target.value})}
                            placeholder="e.g., View Production Reports"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="permissionFeature">Feature</Label>
                          <Select value={permissionForm.feature} onValueChange={(value) => setPermissionForm({...permissionForm, feature: value})}>
                            <SelectTrigger id="permissionFeature" className="w-full">
                              <SelectValue placeholder="Select feature/module" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Common features - add new ones as they're created */}
                              <SelectItem value="dashboard">Dashboard</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                              <SelectItem value="scheduling">Scheduling</SelectItem>
                              <SelectItem value="quality">Quality</SelectItem>
                              <SelectItem value="inventory">Inventory</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="reporting">Reporting</SelectItem>
                              <SelectItem value="users">User Management</SelectItem>
                              <SelectItem value="roles">Role Management</SelectItem>
                              <SelectItem value="permissions">Permission Management</SelectItem>
                              <SelectItem value="settings">Settings</SelectItem>
                              <SelectItem value="ai">AI Features</SelectItem>
                              <SelectItem value="workflows">Workflows</SelectItem>
                              <SelectItem value="analytics">Analytics</SelectItem>
                              <SelectItem value="master-data">Master Data</SelectItem>
                              <SelectItem value="business-goals">Business Goals</SelectItem>
                              <SelectItem value="agents">Agent Management</SelectItem>
                              {/* Show existing features that aren't in the common list */}
                              {features.filter(f => !['dashboard', 'production', 'scheduling', 'quality', 'inventory', 
                                'maintenance', 'reporting', 'users', 'roles', 'permissions', 'settings', 'ai', 
                                'workflows', 'analytics', 'master-data', 'business-goals', 'agents'].includes(f))
                                .map(feature => (
                                  <SelectItem key={feature} value={feature}>
                                    {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/-/g, ' ')}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="permissionAction">Action</Label>
                          <Select value={permissionForm.action} onValueChange={(value) => setPermissionForm({...permissionForm, action: value})}>
                            <SelectTrigger id="permissionAction" className="w-full">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View</SelectItem>
                              <SelectItem value="create">Create</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                              <SelectItem value="delete">Delete</SelectItem>
                              <SelectItem value="manage">Manage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="permissionDescription">Description</Label>
                          <Textarea
                            id="permissionDescription"
                            value={permissionForm.description}
                            onChange={(e) => setPermissionForm({...permissionForm, description: e.target.value})}
                            placeholder="Describe what this permission allows..."
                            rows={3}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setNewPermissionDialog(false)} className="w-full sm:w-auto">
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          if (permissionForm.name && permissionForm.feature && permissionForm.action && permissionForm.description) {
                            createPermissionMutation.mutate(permissionForm);
                          } else {
                            toast({
                              title: "Error",
                              description: "Please fill in all fields",
                              variant: "destructive"
                            });
                          }
                        }} className="w-full sm:w-auto">
                          Create Permission
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                    <SelectTrigger className="w-full sm:w-48">
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
                        <div className="px-2 sm:px-4 pb-4">
                          {/* Mobile Card View */}
                          <div className="block lg:hidden space-y-3">
                            {featureGroup.permissions.map((permission) => {
                              // Find which roles have this permission
                              const rolesWithPermission = roles.filter(role => 
                                role.permissions.some(p => p.id === permission.id)
                              );
                              
                              return (
                                <div key={permission.id} className="border rounded-md p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-1">
                                      <div className="font-medium text-sm">{permission.name}</div>
                                      <Badge variant="outline" className="text-xs">
                                        {permission.action}
                                      </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditPermissionDetails(permission)}
                                        title="Edit permission details"
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeletePermission(permission)}
                                        title="Delete permission"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600">{permission.description}</p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">Assigned to:</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditPermissionRoles(permission, rolesWithPermission)}
                                        title="Edit role assignments"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
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
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Desktop Table View */}
                          <div className="hidden lg:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Permission</TableHead>
                                  <TableHead>Action</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Roles with this Permission</TableHead>
                                  <TableHead>Actions</TableHead>
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
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditPermissionDetails(permission)}
                                            title="Edit permission details"
                                          >
                                            <Settings className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeletePermission(permission)}
                                            title="Delete permission"
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
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
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed information about this user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <p className="font-medium">{selectedUser.username}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div>
                    <Badge className={selectedUser.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium break-all">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">First Name</Label>
                  <p className="font-medium">{selectedUser.firstName || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Last Name</Label>
                  <p className="font-medium">{selectedUser.lastName || 'Not set'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Roles</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedUser.roles?.map((role) => (
                    <Badge key={role.id} variant="outline">
                      {role.name}
                    </Badge>
                  )) || <span className="text-gray-400">No roles assigned</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Last Login</Label>
                  <p className="font-medium text-sm">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Created</Label>
                  <p className="font-medium text-sm">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setViewUserDialog(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role assignments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editUserData.username}
                onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editUserData.firstName}
                  onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editUserData.lastName}
                  onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editUserData.isActive ? 'active' : 'inactive'} 
                onValueChange={(value) => setEditUserData({...editUserData, isActive: value === 'active'})}
              >
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Roles</Label>
              <div className="border rounded-md p-3 space-y-3 max-h-48 overflow-y-auto">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={editUserData.roleIds.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditUserData({...editUserData, roleIds: [...editUserData.roleIds, role.id]});
                        } else {
                          setEditUserData({...editUserData, roleIds: editUserData.roleIds.filter(id => id !== role.id)});
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{role.description.slice(0, 50)}...</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditUserDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={() => updateUserMutation.mutate(editUserData)} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-roleName">Role Name</Label>
              <Input
                id="edit-roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roleDescription">Description</Label>
              <Textarea
                id="edit-roleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                rows={3}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectAllPermissions}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={unselectAllPermissions}
                    className="text-xs"
                  >
                    Unselect All
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-3 space-y-3 max-h-[40vh] sm:max-h-96 overflow-y-auto">
                {permissionsByFeature.map((featureGroup) => (
                  <div key={featureGroup.feature} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800 py-1">
                      {featureGroup.feature}
                    </h4>
                    <div className="space-y-2 pl-2 sm:pl-4">
                      {featureGroup.permissions.map((permission) => (
                        <label key={permission.id} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            checked={roleForm.permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-0.5">
                            <span className="text-sm font-medium block">{permission.name}</span>
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditRoleDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedRole && roleForm.name && roleForm.description) {
                updateRoleMutation.mutate({
                  id: selectedRole.id,
                  ...roleForm
                });
              }
            }} className="w-full sm:w-auto">
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

      {/* Delete User Dialog */}
      <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedUser.username}</p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
              {selectedUser.firstName && (
                <p className="text-sm text-gray-600">{selectedUser.firstName} {selectedUser.lastName}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedUser) {
                  deleteUserMutation.mutate(selectedUser.id);
                }
              }}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteRoleDialog} onOpenChange={setDeleteRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedRole.name}</p>
              <p className="text-sm text-gray-600">{selectedRole.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                This role has {selectedRole.permissions.length} permissions assigned.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoleDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedRole) {
                  deleteRoleMutation.mutate(selectedRole.id);
                }
              }}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Details Dialog */}
      <Dialog open={editPermissionDetailsDialog} onOpenChange={setEditPermissionDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>Update the permission details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editPermissionName">Permission Name</Label>
              <Input
                id="editPermissionName"
                value={permissionForm.name}
                onChange={(e) => setPermissionForm({...permissionForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editPermissionFeature">Feature</Label>
              <Input
                id="editPermissionFeature"
                value={permissionForm.feature}
                onChange={(e) => setPermissionForm({...permissionForm, feature: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editPermissionAction">Action</Label>
              <Select value={permissionForm.action} onValueChange={(value) => setPermissionForm({...permissionForm, action: value})}>
                <SelectTrigger id="editPermissionAction">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="manage">Manage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editPermissionDescription">Description</Label>
              <Textarea
                id="editPermissionDescription"
                value={permissionForm.description}
                onChange={(e) => setPermissionForm({...permissionForm, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermissionDetailsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedPermission && permissionForm.name && permissionForm.feature && permissionForm.action && permissionForm.description) {
                updatePermissionMutation.mutate({
                  id: selectedPermission.id,
                  ...permissionForm
                });
              } else {
                toast({
                  title: "Error",
                  description: "Please fill in all fields",
                  variant: "destructive"
                });
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <Dialog open={deletePermissionDialog} onOpenChange={setDeletePermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this permission? This will remove it from all roles.
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedPermission.name}</p>
              <p className="text-sm text-gray-600">{selectedPermission.feature} - {selectedPermission.action}</p>
              <p className="text-sm text-gray-500 mt-2">{selectedPermission.description}</p>
              <AlertCircle className="h-4 w-4 text-amber-500 inline mr-2 mt-2" />
              <p className="text-sm text-amber-600 dark:text-amber-400 inline">
                This permission will be removed from all roles that currently have it.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePermissionDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedPermission) {
                  deletePermissionMutation.mutate(selectedPermission.id);
                }
              }}
              disabled={deletePermissionMutation.isPending}
            >
              {deletePermissionMutation.isPending ? "Deleting..." : "Delete Permission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Role Users Dialog */}
      <Dialog open={viewRoleUsersDialog} onOpenChange={setViewRoleUsersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Users for {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Add or remove users from this role
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <p className="font-medium text-sm">{selectedRole.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {selectedRole.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Currently has {roleUserIds.length} user{roleUserIds.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div>
                <Label>Assign Users to this Role</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                      <Checkbox
                        checked={roleUserIds.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRoleUserIds([...roleUserIds, user.id]);
                          } else {
                            setRoleUserIds(roleUserIds.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{user.username}</span>
                          <span className="text-xs text-gray-500">({user.email})</span>
                        </div>
                        {user.firstName && (
                          <p className="text-xs text-gray-600">{user.firstName} {user.lastName}</p>
                        )}
                        <div className="flex gap-1 mt-1">
                          {user.roles?.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className={user.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRoleUsersDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedRole) {
                  updateRoleUsersMutation.mutate({
                    roleId: selectedRole.id,
                    userIds: roleUserIds
                  });
                }
              }}
              disabled={updateRoleUsersMutation.isPending}
            >
              {updateRoleUsersMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}