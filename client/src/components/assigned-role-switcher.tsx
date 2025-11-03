import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Role {
  id: number;
  name: string;
  description: string;
}

interface AssignedRoleSwitcherProps {
  userId: number;
  currentRole?: Role | null;
}

export function AssignedRoleSwitcher({ userId, currentRole }: AssignedRoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's assigned roles (not all system roles)
  const { data: assignedRoles = [] } = useQuery({
    queryKey: [`/api/users/${userId}/assigned-roles`],
    enabled: !!userId,
  });

  // Get current role
  const { data: currentRoleData } = useQuery<Role>({
    queryKey: [`/api/users/${userId}/current-role`],
    enabled: !!userId,
  });

  // Switch role mutation
  const switchRoleMutation = useMutation({
    mutationFn: ({ roleId, targetRole }: { roleId: number; targetRole?: string }) => 
      apiRequest('POST', `/api/users/${userId}/switch-role`, { roleId }),
    onSuccess: async (_, variables) => {
      setIsOpen(false);
      setSelectedRoleId('');
      
      // Show transition overlay
      const overlay = document.createElement('div');
      overlay.id = 'role-switch-overlay';
      overlay.className = 'fixed inset-0 bg-gradient-to-br from-blue-50 to-white z-[9999] flex items-center justify-center';
      overlay.innerHTML = `
        <div class="text-center space-y-6 max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-blue-200 dark:border-gray-700 shadow-xl">
          <div class="relative">
            <div class="role-switch-spinner rounded-full h-16 w-16 border-4 mx-auto"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-xl font-semibold text-gray-900 dark:text-white">Switching to ${variables.targetRole || 'new role'}</div>
            <div class="text-sm text-gray-600">Updating interface and permissions...</div>
          </div>
          <div class="flex items-center justify-center space-x-1">
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-100"></div>
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-200"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      
      // Add animation styles
      const style = document.createElement('style');
      style.textContent = `
        .role-switch-spinner {
          border-color: #3b82f6 transparent #3b82f6 transparent;
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
      `;
      document.head.appendChild(style);
      
      // Toast notification
      toast({
        title: "Switching Role",
        description: `Switching to ${variables.targetRole || 'new role'}...`,
        duration: 1500,
      });
      
      // Immediately invalidate all role and user-related queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ 
        predicate: query => {
          const firstKey = query.queryKey[0];
          if (typeof firstKey !== 'string') return false;
          return firstKey.includes("assigned-roles") ||
            firstKey.includes("current-role") ||
            firstKey.includes("users");
        }
      });
      
      // Immediately refetch user data to update UI state
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      
      // Remove overlay after successful role switch
      setTimeout(() => {
        const overlay = document.getElementById('role-switch-overlay');
        if (overlay) {
          overlay.remove();
        }
        // Force a complete page reload to ensure all components reflect new role
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      // Remove overlay on error if it exists
      const overlay = document.getElementById('role-switch-overlay');
      if (overlay) {
        overlay.remove();
      }
      
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch roles",
        variant: "destructive",
      });
    },
  });

  // Don't show if user has only one or no assigned roles
  if (!Array.isArray(assignedRoles) || assignedRoles.length <= 1) {
    return null;
  }

  const handleSwitchRole = () => {
    if (selectedRoleId) {
      const selectedRole = assignedRoles.find((role: Role) => role.id === parseInt(selectedRoleId));
      switchRoleMutation.mutate({ 
        roleId: parseInt(selectedRoleId), 
        targetRole: selectedRole?.name 
      });
    }
  };

  const displayCurrentRole = currentRoleData || currentRole;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCheck className="h-4 w-4" />
          Role: {displayCurrentRole?.name || 'None'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Switch Role
          </DialogTitle>
          <DialogDescription>
            Switch between your assigned roles to access different features and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Role</label>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{displayCurrentRole?.name || 'No role selected'}</div>
                <div className="text-xs text-muted-foreground">
                  {displayCurrentRole?.description || 'No description available'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Switch to Role</label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(assignedRoles) && assignedRoles.map((role: Role) => (
                  <SelectItem 
                    key={role.id} 
                    value={role.id.toString()}
                    disabled={role.id === displayCurrentRole?.id}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {role.name}
                        {role.id === displayCurrentRole?.id && ' (Current)'}
                      </div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSwitchRole}
            disabled={!selectedRoleId || switchRoleMutation.isPending}
            className="gap-2"
          >
            {switchRoleMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Switching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Switch Role
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}