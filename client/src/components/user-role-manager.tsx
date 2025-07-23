import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Shield, Settings, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  isSystemRole: boolean;
}

export function UserRoleManager() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignRoleDialog, setAssignRoleDialog] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users-with-roles'],
  });

  // Fetch all available roles
  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  // Assign role to user mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      apiRequest('POST', `/api/users/${userId}/roles`, { roleId }),
    onSuccess: () => {
      toast({
        title: "Role Assigned",
        description: "User has been successfully assigned to the selected role.",
      });
      setAssignRoleDialog(false);
      setSelectedRoleId('');
      queryClient.invalidateQueries({ queryKey: ['/api/users-with-roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign role to user",
        variant: "destructive",
      });
    },
  });

  // Remove role from user mutation
  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      apiRequest('DELETE', `/api/users/${userId}/roles/${roleId}`),
    onSuccess: () => {
      toast({
        title: "Role Removed",
        description: "User has been successfully removed from the role.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users-with-roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove role from user",
        variant: "destructive",
      });
    },
  });

  const handleAssignRole = () => {
    if (selectedUser && selectedRoleId) {
      assignRoleMutation.mutate({
        userId: selectedUser.id,
        roleId: parseInt(selectedRoleId)
      });
    }
  };

  const handleRemoveRole = (userId: number, roleId: number) => {
    removeRoleMutation.mutate({ userId, roleId });
  };

  const getAvailableRoles = (user: User) => {
    const userRoleIds = user.roles.map(r => r.id);
    return allRoles.filter(role => !userRoleIds.includes(role.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Assign and manage roles for individual users. Each user can have multiple roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found. Create users first to manage their roles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users.map((user) => (
                  <Card key={user.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {user.firstName} {user.lastName}
                          </CardTitle>
                          <CardDescription>
                            @{user.username} • {user.email}
                          </CardDescription>
                        </div>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">
                            Assigned Roles ({user.roles.length})
                          </label>
                          <Dialog 
                            open={assignRoleDialog && selectedUser?.id === user.id}
                            onOpenChange={(open) => {
                              setAssignRoleDialog(open);
                              if (open) {
                                setSelectedUser(user);
                              } else {
                                setSelectedUser(null);
                                setSelectedRoleId('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Role to {user.firstName} {user.lastName}</DialogTitle>
                                <DialogDescription>
                                  Select a role to assign to this user. Users can have multiple roles.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Available Roles</label>
                                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a role to assign..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAvailableRoles(user).map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                          <div className="flex flex-col">
                                            <div className="font-medium">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {role.description}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setAssignRoleDialog(false)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleAssignRole}
                                  disabled={!selectedRoleId || assignRoleMutation.isPending}
                                >
                                  {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {user.roles.length === 0 ? (
                            <div className="text-sm text-gray-500 py-2">
                              No roles assigned
                            </div>
                          ) : (
                            user.roles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3 text-gray-600" />
                                    <span className="font-medium text-sm">{role.name}</span>
                                    {role.isSystemRole && (
                                      <Badge variant="secondary" className="text-xs">System</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {role.description}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveRole(user.id, role.id)}
                                  disabled={removeRoleMutation.isPending}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}