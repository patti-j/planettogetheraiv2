import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserCheck, Shield, Plus, Edit, Trash2, Users, Settings,
  CheckCircle, XCircle, AlertCircle, Maximize2, Minimize2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserRoleManager } from "@/components/user-role-manager";

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Array<{
    id: number;
    name: string;
    feature: string;
    action: string;
    description: string;
  }>;
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

export default function RoleManagementPage() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [newRoleDialog, setNewRoleDialog] = useState(false);
  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as number[]
  });
  const { toast } = useToast();

  // Fetch roles with user counts
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles-management"],
  });

  // Fetch all permissions grouped by feature
  const { data: permissionsByFeature = [], isLoading: permissionsLoading } = useQuery<FeaturePermissions[]>({
    queryKey: ["/api/permissions/grouped"],
  });

  // Get all available features
  const features = permissionsByFeature.map(fp => fp.feature);
  const allPermissions = permissionsByFeature.flatMap(fp => fp.permissions);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: number[] }) => {
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

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string; permissions: number[] }) => {
      const response = await apiRequest("PATCH", `/api/roles-management/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Role has been updated successfully",
      });
      setEditRoleDialog(false);
      setSelectedRole(null);
      setRoleForm({ name: "", description: "", permissions: [] });
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

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await apiRequest("DELETE", `/api/roles-management/${roleId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Deleted",
        description: "Role has been deleted successfully",
      });
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

  const handleCreateRole = () => {
    if (!roleForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }
    createRoleMutation.mutate(roleForm);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions.map(p => p.id)
    });
    setEditRoleDialog(true);
  };

  const handleUpdateRole = () => {
    if (!selectedRole || !roleForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }
    updateRoleMutation.mutate({
      id: selectedRole.id,
      ...roleForm
    });
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

    deleteRoleMutation.mutate(role.id);
  };

  const togglePermission = (permissionId: number) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const toggleFeaturePermissions = (feature: string, action: "all" | "none") => {
    const featurePermissions = permissionsByFeature.find(fp => fp.feature === feature)?.permissions || [];
    const featurePermissionIds = featurePermissions.map(p => p.id);
    
    setRoleForm(prev => {
      if (action === "all") {
        // Add all feature permissions
        const newPermissions = [...new Set([...prev.permissions, ...featurePermissionIds])];
        return { ...prev, permissions: newPermissions };
      } else {
        // Remove all feature permissions
        const newPermissions = prev.permissions.filter(id => !featurePermissionIds.includes(id));
        return { ...prev, permissions: newPermissions };
      }
    });
  };

  const getPermissionBadgeColor = (action: string) => {
    switch (action) {
      case "view": return "bg-blue-100 text-blue-800";
      case "create": return "bg-green-100 text-green-800";
      case "edit": return "bg-yellow-100 text-yellow-800";
      case "delete": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFeaturePermissionCount = (feature: string) => {
    const featurePermissions = permissionsByFeature.find(fp => fp.feature === feature)?.permissions || [];
    const selectedCount = featurePermissions.filter(p => roleForm.permissions.includes(p.id)).length;
    return `${selectedCount}/${featurePermissions.length}`;
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roles management...</p>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="md:ml-0 ml-12">
          <h1 className="text-2xl font-semibold text-gray-800">Role Management</h1>
          <p className="text-gray-600">Define roles and specify feature permissions for different user types</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a new role and specify which features and actions users with this role can access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Sales Manager, Production Scheduler"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of this role"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-base font-medium">Feature Permissions</Label>
                  <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {permissionsByFeature.map(({ feature, permissions }) => (
                      <div key={feature} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Label className="font-medium capitalize">
                              {feature.replace('-', ' ')} ({getFeaturePermissionCount(feature)})
                            </Label>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleFeaturePermissions(feature, "all")}
                            >
                              Select All
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleFeaturePermissions(feature, "none")}
                            >
                              Select None
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 ml-4">
                          {permissions.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`perm-${permission.id}`}
                                checked={roleForm.permissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                                <Badge className={`mr-2 ${getPermissionBadgeColor(permission.action)}`}>
                                  {permission.action}
                                </Badge>
                                {permission.description}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setNewRoleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => r.isSystemRole).length} system, {roles.filter(r => !r.isSystemRole).length} custom
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPermissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {features.length} features
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.reduce((sum, role) => sum + (role.userCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total role assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Manage user roles and their associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.userCount || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {features.map(feature => {
                        const featurePerms = role.permissions.filter(p => p.feature === feature);
                        if (featurePerms.length === 0) return null;
                        return (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature.replace('-', ' ')}: {featurePerms.length}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystemRole ? "default" : "secondary"}>
                      {role.isSystemRole ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!role.isSystemRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
                          disabled={deleteRoleMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Modify role permissions and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={selectedRole?.isSystemRole}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-medium">Feature Permissions</Label>
              <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {permissionsByFeature.map(({ feature, permissions }) => (
                  <div key={feature} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Label className="font-medium capitalize">
                          {feature.replace('-', ' ')} ({getFeaturePermissionCount(feature)})
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleFeaturePermissions(feature, "all")}
                        >
                          Select All
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleFeaturePermissions(feature, "none")}
                        >
                          Select None
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-4">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-perm-${permission.id}`}
                            checked={roleForm.permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={`edit-perm-${permission.id}`} className="text-sm">
                            <Badge className={`mr-2 ${getPermissionBadgeColor(permission.action)}`}>
                              {permission.action}
                            </Badge>
                            {permission.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {mainContent}
    </div>
  );
}