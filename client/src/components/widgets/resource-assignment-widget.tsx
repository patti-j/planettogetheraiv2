import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { 
  Users,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Factory,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  status: string;
  capabilities: number[];
}

interface UserResourceAssignment {
  id: number;
  userId: number;
  resourceId: number;
  assignedBy: number;
  assignedAt: string;
  revokedAt?: string;
  revokedBy?: number;
  canSkipOperations: boolean;
  scheduleVisibilityDays: number;
  notes?: string;
  isActive: boolean;
  user: User;
  resource: Resource;
  assignedByUser?: User;
  revokedByUser?: User;
}

interface ResourceAssignmentWidgetProps {
  config?: {
    supervisorUserId?: number;
    showInactiveAssignments?: boolean;
    showAssignmentHistory?: boolean;
    allowBulkOperations?: boolean;
    defaultScheduleVisibility?: number;
    defaultSkipPermission?: boolean;
  };
  data?: any;
  onAction?: (action: string, data: any) => void;
}

export default function ResourceAssignmentWidget({ 
  config = {}, 
  data, 
  onAction 
}: ResourceAssignmentWidgetProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserResourceAssignment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [newAssignment, setNewAssignment] = useState({
    canSkipOperations: config.defaultSkipPermission || false,
    scheduleVisibilityDays: config.defaultScheduleVisibility || 7,
    notes: ""
  });
  const [currentSupervisorId] = useState(config.supervisorUserId || 1); // Demo supervisor ID
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users?role=operator');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch all resources
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
    queryFn: async () => {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    }
  });

  // Fetch resource assignments
  const { data: assignments, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery<UserResourceAssignment[]>({
    queryKey: ['/api/user-resource-assignments'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!config.showInactiveAssignments) {
        params.append('active', 'true');
      }
      const response = await fetch(`/api/user-resource-assignments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    }
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      return apiRequest('/api/user-resource-assignments', 'POST', {
        ...assignmentData,
        assignedBy: currentSupervisorId
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment Created",
        description: "Resource has been successfully assigned to the user.",
      });
      setAssignDialogOpen(false);
      setSelectedUserId(null);
      setSelectedResourceId(null);
      setNewAssignment({
        canSkipOperations: config.defaultSkipPermission || false,
        scheduleVisibilityDays: config.defaultScheduleVisibility || 7,
        notes: ""
      });
      refetchAssignments();
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: `Failed to create assignment: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/user-resource-assignments/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: "Assignment Updated",
        description: "Resource assignment has been successfully updated.",
      });
      setEditDialogOpen(false);
      setEditingAssignment(null);
      refetchAssignments();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update assignment: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Revoke assignment mutation
  const revokeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest(`/api/user-resource-assignments/${assignmentId}/revoke`, 'PATCH', {
        revokedBy: currentSupervisorId
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment Revoked",
        description: "Resource assignment has been revoked.",
      });
      refetchAssignments();
    },
    onError: (error) => {
      toast({
        title: "Revoke Failed",
        description: `Failed to revoke assignment: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter assignments based on search and filters
  const filteredAssignments = assignments?.filter(assignment => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesUser = assignment.user.username.toLowerCase().includes(searchLower) ||
                         assignment.user.email.toLowerCase().includes(searchLower) ||
                         `${assignment.user.firstName} ${assignment.user.lastName}`.toLowerCase().includes(searchLower);
      const matchesResource = assignment.resource.name.toLowerCase().includes(searchLower);
      if (!matchesUser && !matchesResource) return false;
    }

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "active" && !assignment.isActive) return false;
      if (filterStatus === "inactive" && assignment.isActive) return false;
    }

    // Resource filter
    if (filterResource !== "all") {
      if (assignment.resource.type !== filterResource) return false;
    }

    return true;
  }) || [];

  const handleCreateAssignment = () => {
    if (!selectedUserId || !selectedResourceId) {
      toast({
        title: "Missing Information",
        description: "Please select both a user and resource.",
        variant: "destructive",
      });
      return;
    }

    createAssignmentMutation.mutate({
      userId: selectedUserId,
      resourceId: selectedResourceId,
      ...newAssignment
    });
  };

  const handleEditAssignment = (assignment: UserResourceAssignment) => {
    setEditingAssignment(assignment);
    setEditDialogOpen(true);
  };

  const handleUpdateAssignment = () => {
    if (!editingAssignment) return;

    updateAssignmentMutation.mutate({
      id: editingAssignment.id,
      canSkipOperations: editingAssignment.canSkipOperations,
      scheduleVisibilityDays: editingAssignment.scheduleVisibilityDays,
      notes: editingAssignment.notes
    });
  };

  const handleRevokeAssignment = (assignmentId: number) => {
    if (confirm("Are you sure you want to revoke this resource assignment?")) {
      revokeAssignmentMutation.mutate(assignmentId);
    }
  };

  const getResourceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const uniqueResourceTypes = [...new Set(resources?.map(r => r.type) || [])];

  return (
    <div className="w-full h-full space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Resource Assignments
            </div>
            <Button onClick={() => setAssignDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Assignment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users or resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResourceTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{assignments?.filter(a => a.isActive).length || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Assignments</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{assignments?.filter(a => a.canSkipOperations).length || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Can Skip Operations</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{new Set(assignments?.filter(a => a.isActive).map(a => a.userId)).size || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{new Set(assignments?.filter(a => a.isActive).map(a => a.resourceId)).size || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Assigned Resources</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Current Assignments</span>
            <Badge variant="secondary">{filteredAssignments.length} assignments</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <Users className="w-8 h-8 animate-pulse text-gray-400 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400">Loading assignments...</p>
              </div>
            </div>
          ) : !filteredAssignments.length ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <Users className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400">No assignments found</p>
                <p className="text-sm text-gray-500">Create your first resource assignment</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} className={`${assignment.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-500 opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                {assignment.user.firstName && assignment.user.lastName 
                                  ? `${assignment.user.firstName} ${assignment.user.lastName}` 
                                  : assignment.user.username}
                              </span>
                              <span className="text-sm text-gray-500">({assignment.user.email})</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center gap-2">
                              <Factory className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{assignment.resource.name}</span>
                              <Badge variant="outline">{assignment.resource.type}</Badge>
                              <div className={`w-2 h-2 rounded-full ${getResourceStatusColor(assignment.resource.status)}`} />
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Visibility: {assignment.scheduleVisibilityDays} days</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {assignment.canSkipOperations ? (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600">Can skip operations</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 text-gray-500" />
                                  <span>Cannot skip operations</span>
                                </>
                              )}
                            </div>
                          </div>

                          {assignment.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              "{assignment.notes}"
                            </p>
                          )}

                          {assignment.revokedAt && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <UserX className="w-4 h-4" />
                              <span>Revoked on {new Date(assignment.revokedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={assignment.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {assignment.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAssignment(assignment)}
                              disabled={!assignment.isActive}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            {assignment.isActive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserX className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Resource Assignment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Select User</Label>
              <Select value={selectedUserId?.toString() || ""} onValueChange={(value) => setSelectedUserId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.filter(user => user.isActive).map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</span>
                        <span className="text-sm text-gray-500">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Resource</Label>
              <Select value={selectedResourceId?.toString() || ""} onValueChange={(value) => setSelectedResourceId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resource..." />
                </SelectTrigger>
                <SelectContent>
                  {resources?.filter(resource => resource.status === 'active').map((resource) => (
                    <SelectItem key={resource.id} value={resource.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4" />
                        <span>{resource.name}</span>
                        <Badge variant="outline">{resource.type}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Skip Operations</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Operator can skip operations with reason
                  </p>
                </div>
                <Switch
                  checked={newAssignment.canSkipOperations}
                  onCheckedChange={(checked) => setNewAssignment(prev => ({ ...prev, canSkipOperations: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="visibility-days">Schedule Visibility (Days)</Label>
                <Input
                  id="visibility-days"
                  type="number"
                  min="1"
                  max="30"
                  value={newAssignment.scheduleVisibilityDays}
                  onChange={(e) => setNewAssignment(prev => ({ 
                    ...prev, 
                    scheduleVisibilityDays: parseInt(e.target.value) || 7 
                  }))}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  How many days ahead the operator can see scheduled operations
                </p>
              </div>

              <div>
                <Label htmlFor="assignment-notes">Notes</Label>
                <Textarea
                  id="assignment-notes"
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this assignment..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAssignment} 
              disabled={createAssignmentMutation.isPending || !selectedUserId || !selectedResourceId}
            >
              {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Resource Assignment</DialogTitle>
          </DialogHeader>
          
          {editingAssignment && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {editingAssignment.user.firstName && editingAssignment.user.lastName 
                      ? `${editingAssignment.user.firstName} ${editingAssignment.user.lastName}` 
                      : editingAssignment.user.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4" />
                  <span>{editingAssignment.resource.name}</span>
                  <Badge variant="outline">{editingAssignment.resource.type}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Skip Operations</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Operator can skip operations with reason
                  </p>
                </div>
                <Switch
                  checked={editingAssignment.canSkipOperations}
                  onCheckedChange={(checked) => 
                    setEditingAssignment(prev => prev ? { ...prev, canSkipOperations: checked } : null)
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-visibility-days">Schedule Visibility (Days)</Label>
                <Input
                  id="edit-visibility-days"
                  type="number"
                  min="1"
                  max="30"
                  value={editingAssignment.scheduleVisibilityDays}
                  onChange={(e) => 
                    setEditingAssignment(prev => prev ? { 
                      ...prev, 
                      scheduleVisibilityDays: parseInt(e.target.value) || 7 
                    } : null)
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingAssignment.notes || ""}
                  onChange={(e) => 
                    setEditingAssignment(prev => prev ? { ...prev, notes: e.target.value } : null)
                  }
                  placeholder="Additional notes about this assignment..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAssignment} 
              disabled={updateAssignmentMutation.isPending}
            >
              {updateAssignmentMutation.isPending ? "Updating..." : "Update Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}