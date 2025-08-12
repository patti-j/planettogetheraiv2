import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Users, Factory, Plus, X, CheckCircle, AlertCircle, Settings2, ChevronDown } from 'lucide-react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResourceAssignmentWidgetProps {
  className?: string;
}

interface OperatorUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  department?: string;
  jobTitle?: string;
  roles: string[];
}

interface ResourceWithAssignments {
  id: number;
  name: string;
  type: string;
  status: string;
  isDrum?: boolean;
  capabilities?: number[];
  assignedOperators: {
    userId: number;
    username: string;
    fullName: string;
    assignedAt: string;
    canSkipOperations?: boolean;
    scheduleVisibilityDays?: number;
    notes?: string;
  }[];
}

export default function ResourceAssignmentWidget({ 
  className = '' 
}: ResourceAssignmentWidgetProps) {
  const { toast } = useToast();
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<number[]>([]);
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOperatorDropdown(false);
      }
    };
    
    if (showOperatorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOperatorDropdown]);
  
  // Fetch operators
  const { data: operators = [], isLoading: loadingOperators } = useQuery<OperatorUser[]>({
    queryKey: ["/api/user-resource-assignments/operators"],
    staleTime: 30000,
  });
  
  // Fetch resources with their assignments
  const { data: resources = [], isLoading: loadingResources } = useQuery<ResourceWithAssignments[]>({
    queryKey: ["/api/user-resource-assignments/resources"],
    staleTime: 30000,
    refetchInterval: 60000,
  });
  
  // Mutation for assigning operators
  const assignMutation = useMutation({
    mutationFn: async (data: { userIds: number[]; resourceId: number; notes?: string }) => {
      const assignments = await Promise.all(
        data.userIds.map(userId => 
          fetch('/api/user-resource-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, resourceId: data.resourceId, notes: data.notes }),
            credentials: 'include',
          }).then(res => res.json())
        )
      );
      return assignments;
    },
    onSuccess: (data) => {
      const count = data.length;
      toast({
        title: "Success",
        description: `${count} operator${count > 1 ? 's' : ''} assigned successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-resource-assignments/resources"] });
      setSelectedOperatorIds([]);
      setSelectedResourceId(null);
      setShowOperatorDropdown(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign operators. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for removing assignments
  const removeMutation = useMutation({
    mutationFn: async ({ userId, resourceId }: { userId: number; resourceId: number }) => {
      const response = await fetch(`/api/user-resource-assignments/${userId}/${resourceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove assignment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assignment removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-resource-assignments/resources"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove assignment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const isLoading = loadingOperators || loadingResources;

  const handleAssignOperator = () => {
    if (selectedOperatorIds.length > 0 && selectedResourceId) {
      assignMutation.mutate({
        userIds: selectedOperatorIds,
        resourceId: selectedResourceId,
      });
    }
  };
  
  const toggleOperatorSelection = (operatorId: number) => {
    setSelectedOperatorIds(prev => 
      prev.includes(operatorId)
        ? prev.filter(id => id !== operatorId)
        : [...prev, operatorId]
    );
  };
  
  const handleRemoveAssignment = (userId: number, resourceId: number) => {
    removeMutation.mutate({ userId, resourceId });
  };
  
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading assignments...</p>
        </div>
      </div>
    );
  }
  
  // Get available operators (those not assigned to selected resource)
  const selectedResource = resources?.find(r => r.id === selectedResourceId);
  const availableOperators = operators?.filter(op => 
    !selectedResource?.assignedOperators?.some(ao => ao.userId === op.id)
  ) || [];
  
  // Get resource type icon
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
      case 'machine':
        return <Settings2 className="w-4 h-4 text-blue-500" />;
      case 'labor':
      case 'operator':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <Factory className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Calculate statistics
  const totalResources = resources?.length || 0;
  const totalOperators = operators?.length || 0;
  const totalAssignments = resources?.reduce((sum, r) => sum + (r.assignedOperators?.length || 0), 0) || 0;
  const resourcesWithAssignments = resources?.filter(r => (r.assignedOperators?.length || 0) > 0).length || 0;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalResources}</div>
            <div className="text-xs text-muted-foreground">Total Resources</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalOperators}</div>
            <div className="text-xs text-muted-foreground">Total Operators</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalAssignments}</div>
            <div className="text-xs text-muted-foreground">Active Assignments</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{resourcesWithAssignments}</div>
            <div className="text-xs text-muted-foreground">Resources Assigned</div>
          </div>
        </Card>
      </div>

      {/* Assignment Controls */}
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Assign Operator to Resource
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={selectedResourceId?.toString() || ""} onValueChange={(v) => {
              setSelectedResourceId(Number(v));
              setSelectedOperatorIds([]); // Clear selected operators when resource changes
              setShowOperatorDropdown(false);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Resource" />
              </SelectTrigger>
              <SelectContent>
                {resources?.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.type)}
                      <span>{resource.name}</span>
                      {resource.isDrum && <Badge variant="secondary" className="ml-2 text-xs">Drum</Badge>}
                    </div>
                  </SelectItem>
                )) || <SelectItem value="">No resources available</SelectItem>}
              </SelectContent>
            </Select>
            
            <div className="relative" ref={dropdownRef}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOperatorDropdown(!showOperatorDropdown)}
                disabled={!selectedResourceId}
                className="w-full justify-between"
              >
                <span className="text-left truncate">
                  {selectedOperatorIds.length > 0
                    ? `${selectedOperatorIds.length} operator${selectedOperatorIds.length > 1 ? 's' : ''} selected`
                    : selectedResourceId 
                      ? "Select Operators" 
                      : "Select Resource First"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
              
              {showOperatorDropdown && selectedResourceId && (
                <Card className="absolute z-10 w-full mt-1 p-2 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {availableOperators.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        All operators are assigned to this resource
                      </div>
                    ) : (
                      <>
                        {availableOperators.length > 1 && (
                          <div className="flex gap-2 pb-2 border-b">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOperatorIds(availableOperators.map(op => op.id))}
                              className="text-xs flex-1"
                            >
                              Select All ({availableOperators.length})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOperatorIds([])}
                              className="text-xs flex-1"
                            >
                              Clear All
                            </Button>
                          </div>
                        )}
                        {availableOperators.map((operator) => (
                          <div
                            key={operator.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => toggleOperatorSelection(operator.id)}
                          >
                            <Checkbox
                              checked={selectedOperatorIds.includes(operator.id)}
                              onCheckedChange={() => toggleOperatorSelection(operator.id)}
                            />
                            <div className="flex flex-col flex-1">
                              <span className="text-sm font-medium">{operator.fullName}</span>
                              <span className="text-xs text-muted-foreground">
                                {operator.department || 'No Department'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {availableOperators.length > 0 && (
                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowOperatorDropdown(false)}
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
            
            <Button 
              onClick={handleAssignOperator}
              disabled={!selectedResourceId || selectedOperatorIds.length === 0 || assignMutation.isPending}
              className="w-full"
            >
              {assignMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assign {selectedOperatorIds.length > 0 ? `(${selectedOperatorIds.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Resources with Assignments */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Current Assignments
        </h4>
        
        {!resources || resources.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <Factory className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No resources available</p>
            </div>
          </Card>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {resources?.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <div className="space-y-3">
                    {/* Resource Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getResourceIcon(resource.type)}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {resource.name}
                            {resource.isDrum && (
                              <Badge variant="secondary" className="text-xs">Drum</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {resource.type} • Status: {resource.status}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {resource.assignedOperators?.length || 0} Operator{(resource.assignedOperators?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {/* Assigned Operators */}
                    {resource.assignedOperators && resource.assignedOperators.length > 0 ? (
                      <div className="space-y-2">
                        <Separator />
                        {resource.assignedOperators.map((assignment) => (
                          <div key={assignment.userId} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-green-500" />
                              <div>
                                <div className="text-sm font-medium">{assignment.fullName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.userId, resource.id)}
                              disabled={removeMutation.isPending}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded text-center">
                        No operators assigned
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}