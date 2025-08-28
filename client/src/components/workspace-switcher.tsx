import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, UserCheck, RefreshCw, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Role {
  id: number;
  name: string;
  description: string;
}

interface WorkspaceSwitcherProps {
  userId: number;
  currentRole?: Role | null;
  variant?: 'header' | 'compact';
  showIcon?: boolean;
}

const getWorkspaceFromRole = (roleName: string): string => {
  const roleNameLower = roleName.toLowerCase();
  
  if (roleNameLower.includes('production') || roleNameLower.includes('scheduler')) {
    return 'Production';
  }
  if (roleNameLower.includes('planning') || roleNameLower.includes('planner')) {
    return 'Planning';
  }
  if (roleNameLower.includes('quality') || roleNameLower.includes('qa')) {
    return 'Quality';
  }
  if (roleNameLower.includes('maintenance')) {
    return 'Maintenance';
  }
  if (roleNameLower.includes('inventory') || roleNameLower.includes('warehouse')) {
    return 'Inventory';
  }
  if (roleNameLower.includes('admin') || roleNameLower.includes('administrator')) {
    return 'Administration';
  }
  if (roleNameLower.includes('manager') || roleNameLower.includes('supervisor')) {
    return 'Management';
  }
  if (roleNameLower.includes('operator') || roleNameLower.includes('technician')) {
    return 'Operations';
  }
  
  // Default fallback
  return roleName.split(' ')[0] || 'Workspace';
};

export function WorkspaceSwitcher({ 
  userId, 
  currentRole, 
  variant = 'header',
  showIcon = true
}: WorkspaceSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Get user's assigned roles
  const { data: assignedRoles = [] } = useQuery({
    queryKey: [`/api/users/${userId}/assigned-roles`],
    enabled: !!userId,
    queryFn: async () => {
      const response = await apiRequest(`/api/users/${userId}/assigned-roles`);
      return await response.json();
    },
  });

  // Get current role
  const { data: currentRoleData } = useQuery({
    queryKey: [`/api/users/${userId}/current-role`],
    enabled: !!userId,
    queryFn: async () => {
      const response = await apiRequest(`/api/users/${userId}/current-role`);
      return await response.json();
    },
  });

  // Switch role mutation
  const switchRoleMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: number }) => 
      apiRequest(`/api/users/${userId}/switch-role`, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: async (_, variables) => {
      setIsLoading(false);
      
      // Show transition overlay
      const overlay = document.createElement('div');
      overlay.id = 'workspace-switch-overlay';
      overlay.className = 'fixed inset-0 bg-gradient-to-br from-blue-50 to-white z-[9999] flex items-center justify-center';
      overlay.innerHTML = `
        <div class="text-center space-y-6 max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-blue-200 dark:border-gray-700 shadow-xl">
          <div class="relative">
            <div class="workspace-switch-spinner rounded-full h-16 w-16 border-4 mx-auto"></div>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Switching Workspace</h2>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Loading your new workspace environment...</p>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      
      // Add spinner animation styles
      const style = document.createElement('style');
      style.textContent = `
        .workspace-switch-spinner {
          border-color: #e5e7eb;
          border-top-color: #3b82f6;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      // Invalidate all queries to refresh data without losing authentication
      setTimeout(() => {
        queryClient.invalidateQueries();
        // Remove overlay after queries refresh
        setTimeout(() => {
          const overlayElement = document.getElementById('workspace-switch-overlay');
          if (overlayElement) {
            overlayElement.remove();
          }
        }, 500);
      }, 1500);
      
      toast({
        title: "Workspace Switched",
        description: "Your workspace has been updated successfully.",
      });
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to switch workspace. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSwitch = (roleId: number, roleName: string) => {
    setIsLoading(true);
    const workspaceName = getWorkspaceFromRole(roleName);
    switchRoleMutation.mutate({ roleId });
  };

  // Determine the current workspace name - use active role if available, otherwise use first assigned role
  let currentRoleName = null;
  if (currentRoleData?.activeRole?.name) {
    currentRoleName = currentRoleData.activeRole.name;
  } else if (assignedRoles.length > 0) {
    // If no active role is set, use the first assigned role
    currentRoleName = assignedRoles[0].name;
  }
  
  const currentWorkspace = currentRoleName 
    ? getWorkspaceFromRole(currentRoleName)
    : 'Workspace';

  const isCompact = variant === 'compact';

  // Always show dropdown if user has multiple assigned roles, or show static if single role
  if (assignedRoles.length === 0) {
    // Only show static display if user has no roles at all
    return (
      <div className={`flex items-center gap-2 ${isCompact ? 'px-2 py-1' : 'px-3 py-2'}`}>
        {showIcon && <Building2 className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-muted-foreground`} />}
        <span className={`font-medium text-foreground ${isCompact ? 'text-sm' : ''}`}>
          No Workspace
        </span>
      </div>
    );
  }

  // Show static display for single role (no switching needed)
  if (assignedRoles.length === 1) {
    return (
      <div className={`flex items-center gap-2 ${isCompact ? 'px-2 py-1' : 'px-3 py-2'}`}>
        {showIcon && <Building2 className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-muted-foreground`} />}
        <div className={`flex flex-col items-start ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {!isCompact && (
            <span className="text-xs text-muted-foreground leading-tight">Workspace</span>
          )}
          <span className="font-medium leading-tight">
            {currentWorkspace}
          </span>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`gap-2 hover:bg-muted ${isCompact ? 'h-8 px-2 py-1' : 'h-9 px-3 py-2'} ${isLoading ? 'opacity-60' : ''}`}
          disabled={isLoading}
        >
          {showIcon && (
            isLoading ? 
              <RefreshCw className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} /> :
              <Building2 className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-muted-foreground`} />
          )}
          <div className={`flex flex-col items-start ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {!isCompact && (
              <span className="text-xs text-muted-foreground leading-tight">Workspace</span>
            )}
            <span className="font-medium leading-tight">
              {currentWorkspace}
            </span>
          </div>
          <ChevronDown className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-muted-foreground`} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Switch Workspace
        </div>
        <DropdownMenuSeparator />
        
        {assignedRoles.map((role: Role) => {
          const workspace = getWorkspaceFromRole(role.name);
          // Consider role current if it's the active role OR if no active role set and it's the first role
          const isCurrentRole = currentRoleData?.activeRole?.id === role.id || 
            (!currentRoleData?.activeRole && assignedRoles[0]?.id === role.id);
          
          return (
            <DropdownMenuItem
              key={role.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                isCurrentRole ? 'bg-muted' : ''
              }`}
              onClick={() => !isCurrentRole && handleRoleSwitch(role.id, role.name)}
              disabled={isCurrentRole}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{workspace}</span>
                  <span className="text-xs text-muted-foreground truncate">{role.name}</span>
                </div>
                {isCurrentRole && (
                  <Badge variant="secondary" className="text-xs">Current</Badge>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {assignedRoles.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No workspaces available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}