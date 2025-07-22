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
import { Badge } from '@/components/ui/badge';
import { UserCheck, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Role {
  id: number;
  name: string;
  description: string;
}

interface RoleSwitcherProps {
  userId: number;
  currentRole?: Role | null;
}

export function RoleSwitcher({ userId, currentRole }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has training permissions
  const { data: hasPermission } = useQuery({
    queryKey: [`/api/users/${userId}/permissions/check`, 'training', 'view'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${userId}/permissions/check?feature=training&action=view`);
      return await response.json();
    },
  });

  // Get all system roles for training demonstrations
  const { data: availableRoles = [] } = useQuery({
    queryKey: ['/api/roles'],
    enabled: hasPermission?.hasPermission,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/roles');
      return await response.json();
    },
  });

  // Get current role
  const { data: currentRoleData } = useQuery({
    queryKey: [`/api/users/${userId}/current-role`],
    enabled: hasPermission?.hasPermission,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${userId}/current-role`);
      return await response.json();
    },
  });

  // Switch role mutation
  const switchRoleMutation = useMutation({
    mutationFn: ({ roleId, targetRole }: { roleId: number; targetRole?: string }) => 
      apiRequest('POST', `/api/users/${userId}/switch-role`, { roleId }),
    onSuccess: async (_, variables) => {
      setIsOpen(false);
      setSelectedRoleId('');
      
      // Show smooth transition overlay
      const overlay = document.createElement('div');
      overlay.id = 'role-switch-overlay';
      overlay.className = 'fixed inset-0 bg-gradient-to-br from-blue-50 to-white z-[9999] flex items-center justify-center';
      overlay.innerHTML = `
        <div class="text-center space-y-6 max-w-md mx-auto p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-200 shadow-xl">
          <div class="relative">
            <div class="role-switch-spinner rounded-full h-16 w-16 border-4 mx-auto"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-xl font-semibold text-gray-900">Switching to ${variables.targetRole === 'Trainer' ? 'Trainer Mode' : 'New Role'}</div>
            <div class="text-sm text-gray-600">Updating interface and permissions...</div>
          </div>
          <div class="flex items-center justify-center space-x-1">
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Toast notification
      toast({
        title: "Role Switch in Progress",
        description: `Switching to ${variables.targetRole === 'Trainer' ? 'Trainer mode' : 'new role'}...`,
        duration: 1500,
      });
      
      // Clear all cached queries
      queryClient.clear();
      
      // Determine redirect path based on target role
      const redirectPath = variables.targetRole === 'Trainer' ? '/training' : '/';
      
      // Smooth transition with reduced delay
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 800);
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

  // Don't show the switcher if user doesn't have permission
  if (!hasPermission?.hasPermission || !Array.isArray(availableRoles) || availableRoles.length === 0) {
    return null;
  }

  const handleSwitchRole = () => {
    if (selectedRoleId) {
      const selectedRole = availableRoles.find((role: Role) => role.id === parseInt(selectedRoleId));
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
          <RotateCcw className="h-4 w-4" />
          Role: {displayCurrentRole?.name || 'None'}
          <Badge variant="secondary" className="text-xs">Training</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Switch Training Role
          </DialogTitle>
          <DialogDescription>
            As a trainer or systems manager, you can switch to any system role to demonstrate 
            their features and capabilities for training purposes.
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
                <SelectValue placeholder="Select a role to switch to..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(availableRoles) && availableRoles.map((role: Role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    <div className="flex flex-col">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">Training Mode</div>
                <div className="text-blue-700">
                  When you switch roles, the entire interface will update to show only the features 
                  and permissions available to that role. This allows you to demonstrate the user 
                  experience for different types of users.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          {/* Exit Training Mode Button */}
          <Button
            variant="outline"
            onClick={() => {
              // Find the Trainer role ID and switch back to it
              const trainerRole = availableRoles.find((role: Role) => role.name === 'Trainer');
              if (trainerRole) {
                switchRoleMutation.mutate({ 
                  roleId: trainerRole.id, 
                  targetRole: 'Trainer' 
                });
              }
            }}
            disabled={switchRoleMutation.isPending || displayCurrentRole?.name === 'Trainer'}
            className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 role-switch-btn"
          >
            {switchRoleMutation.isPending && displayCurrentRole?.name !== 'Trainer' ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Returning to Trainer...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Exit to Trainer
              </>
            )}
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSwitchRole}
              disabled={!selectedRoleId || switchRoleMutation.isPending}
              className="gap-2 role-switch-btn"
            >
              {switchRoleMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Switching...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Switch Role
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}