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
  CheckCircle, XCircle, AlertCircle, Maximize2, Minimize2, Sparkles, Copy,
  ArrowRight, Check
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
  const [aiPermissionDialog, setAiPermissionDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [aiPermissionPreviewDialog, setAiPermissionPreviewDialog] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<any>(null);
  const [aiPermissionForm, setAiPermissionForm] = useState({
    description: ""
  });
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

  // AI permission generation preview mutation
  const generateAiPermissionsMutation = useMutation({
    mutationFn: async (data: { roleIds: number[], description: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-permissions-preview", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiPreviewData(data);
      setAiPermissionDialog(false);
      setAiPermissionPreviewDialog(true);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to generate permissions with AI";
      toast({
        title: "Generation Failed", 
        description: (
          <div className="flex items-center gap-2">
            <span className="flex-1">{errorMessage}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(errorMessage);
                toast({ title: "Copied!", description: "Error message copied to clipboard" });
              }}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ),
        variant: "destructive",
      });
    },
  });

  // AI permission application mutation
  const applyAiPermissionsMutation = useMutation({
    mutationFn: async (changes: any[]) => {
      const response = await apiRequest("POST", "/api/ai/apply-permissions", { changes });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Permissions Applied",
        description: `Successfully applied permissions to ${data.totalRolesModified} role(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles-management"] });
      setAiPermissionPreviewDialog(false);
      setSelectedRoles([]);
      setAiPermissionForm({ description: "" });
      setAiPreviewData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to apply permission changes",
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
        const newPermissions = Array.from(new Set([...prev.permissions, ...featurePermissionIds]));
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

  const handleAiPermissionGeneration = () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "No Roles Selected",
        description: "Please select at least one role to generate permissions for",
        variant: "destructive",
      });
      return;
    }
    generateAiPermissionsMutation.mutate({
      roleIds: selectedRoles,
      description: aiPermissionForm.description
    });
  };

  const handleRoleSelection = (roleId: number, checked: boolean) => {
    setSelectedRoles(prev => 
      checked 
        ? [...prev, roleId]
        : prev.filter(id => id !== roleId)
    );
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
          <Dialog open={aiPermissionDialog} onOpenChange={setAiPermissionDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={generateAiPermissionsMutation.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateAiPermissionsMutation.isPending ? "Generating..." : "AI Permissions"}
              </Button>
            </DialogTrigger>
          </Dialog>
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
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedRoles.length === roles.length}
                    onCheckedChange={(checked) => {
                      setSelectedRoles(checked ? roles.map(r => r.id) : []);
                    }}
                  />
                </TableHead>
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
                  <TableCell>
                    <Checkbox 
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleSelection(role.id, checked as boolean)}
                    />
                  </TableCell>
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

      {/* AI Permission Generation Dialog */}
      <Dialog open={aiPermissionDialog} onOpenChange={setAiPermissionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Permission Generation
            </DialogTitle>
            <DialogDescription>
              Generate permissions for selected roles using AI based on role names and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Selected Roles ({selectedRoles.length})</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {selectedRoles.length === 0 ? (
                  <p className="text-sm text-gray-500">No roles selected. Please select roles from the table first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      return role ? (
                        <Badge key={roleId} variant="secondary">
                          {role.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="ai-description">Additional Context (Optional)</Label>
              <Textarea
                id="ai-description"
                placeholder="Describe how permissions should be assigned to these roles. For example: 'Give the Quality Manager role permissions to view reports and manage quality control processes, but not delete data' or 'Marketing roles should have access to analytics and customer data but no system administration'"
                value={aiPermissionForm.description}
                onChange={(e) => setAiPermissionForm({...aiPermissionForm, description: e.target.value})}
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                AI will analyze role names and this description to generate appropriate permissions.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAiPermissionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAiPermissionGeneration}
                disabled={generateAiPermissionsMutation.isPending || selectedRoles.length === 0}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateAiPermissionsMutation.isPending ? "Generating..." : "Generate Permissions"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Permission Preview Dialog */}
      <Dialog open={aiPermissionPreviewDialog} onOpenChange={setAiPermissionPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Review Permission Changes
            </DialogTitle>
            <DialogDescription>
              Review the AI-suggested permission changes before applying them to your roles.
            </DialogDescription>
          </DialogHeader>
          
          {aiPreviewData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                <p className="text-blue-800 text-sm">{aiPreviewData.summary}</p>
                {aiPreviewData.reasoning && (
                  <p className="text-blue-700 text-xs mt-2">{aiPreviewData.reasoning}</p>
                )}
              </div>

              {/* Changes Preview */}
              <div className="space-y-4">
                <h4 className="font-medium">Planned Changes</h4>
                {aiPreviewData.changes?.length > 0 ? (
                  <div className="space-y-3">
                    {aiPreviewData.changes.map((change: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{change.roleName}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{change.currentPermissionCount} current permissions</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{change.totalPermissionsAfter} total after changes</span>
                          </div>
                        </div>
                        
                        {change.newPermissions?.length > 0 ? (
                          <div>
                            <h6 className="text-sm font-medium text-green-700 mb-2">
                              Adding {change.newPermissions.length} new permission(s):
                            </h6>
                            <div className="grid grid-cols-2 gap-2">
                              {change.newPermissions.map((perm: any, permIndex: number) => (
                                <div key={permIndex} className="flex items-center gap-2 text-sm">
                                  <Badge className={getPermissionBadgeColor(perm.permission.action)}>
                                    {perm.permission.action}
                                  </Badge>
                                  <span className="text-green-700">{perm.permission.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">No new permissions to add for this role</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No permission changes suggested
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setAiPermissionPreviewDialog(false);
                  setAiPreviewData(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => applyAiPermissionsMutation.mutate(aiPreviewData.changes)}
                  disabled={applyAiPermissionsMutation.isPending || !aiPreviewData.changes?.some((change: any) => change.newPermissions?.length > 0)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {applyAiPermissionsMutation.isPending ? "Applying Changes..." : "Apply Changes"}
                </Button>
              </div>
            </div>
          )}
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