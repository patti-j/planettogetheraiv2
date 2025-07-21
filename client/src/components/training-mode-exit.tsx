import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export function TrainingModeExit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current role
  const { data: currentRole } = useQuery({
    queryKey: [`/api/users/${user?.id}/current-role`],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${user?.id}/current-role`);
      return await response.json();
    },
  });

  // Get user's original trainer/systems manager roles
  const { data: assignedRoles = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/assigned-roles`],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get all roles assigned to this user
      const response = await apiRequest('GET', `/api/users/${user?.id}/assigned-roles`);
      return await response.json();
    },
    retry: false, // Don't retry if permission denied
  });

  // Exit training mode mutation
  const exitTrainingMutation = useMutation({
    mutationFn: async () => {
      // Find the user's trainer or systems manager role
      const trainerRole = Array.isArray(assignedRoles) ? assignedRoles.find((role: any) => role.name === 'Trainer') : null;
      const systemsManagerRole = Array.isArray(assignedRoles) ? assignedRoles.find((role: any) => role.name === 'Systems Manager') : null;
      
      const originalRoleId = trainerRole?.id || systemsManagerRole?.id;
      console.log('=== TRAINING EXIT DEBUG ===');
      console.log('Assigned roles:', assignedRoles);
      console.log('Trainer role:', trainerRole);
      console.log('Systems Manager role:', systemsManagerRole);
      console.log('Switching to role ID:', originalRoleId);
      
      if (!originalRoleId) {
        throw new Error('Cannot find original role to return to');
      }

      return apiRequest('POST', `/api/users/${user?.id}/switch-role`, { roleId: originalRoleId });
    },
    onSuccess: () => {
      toast({
        title: "Training Mode Exited Successfully!",
        description: "You have returned to your full role with all permissions. The interface will update in a moment.",
        duration: 5000,
      });
      queryClient.invalidateQueries();
      // Wait 5 seconds to allow user to read the message, then redirect to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Exit Failed", 
        description: error.message || "Failed to exit training mode",
        variant: "destructive",
      });
    },
  });

  // Don't show if user doesn't exist
  if (!user?.id || !currentRole) {
    return null;
  }

  // Check if user is in training mode (has trainer/systems manager roles but is currently in a different role)
  const isTrainer = Array.isArray(assignedRoles) && assignedRoles.some((role: any) => role.name === 'Trainer');
  const isSystemsManager = Array.isArray(assignedRoles) && assignedRoles.some((role: any) => role.name === 'Systems Manager');
  const isInTrainingMode = (isTrainer || isSystemsManager) && 
                          currentRole.name !== 'Trainer' && 
                          currentRole.name !== 'Systems Manager';

  // Only show if in training mode
  if (!isInTrainingMode) {
    return null;
  }

  const originalRole = isTrainer ? 'Trainer' : 'Systems Manager';

  return (
    <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">Training Mode</span>
        </div>
        <div className="text-xs px-2 py-1 bg-orange-100 border border-orange-300 rounded text-orange-700">
          {currentRole.name}
        </div>
      </div>
      <p className="text-xs text-orange-700 mb-3">
        You're demonstrating the {currentRole.name} role. Click below to return to your full {originalRole} permissions.
      </p>
      <Button 
        onClick={() => exitTrainingMutation.mutate()}
        disabled={exitTrainingMutation.isPending}
        size="sm"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs"
      >
        {exitTrainingMutation.isPending ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Exiting...
          </>
        ) : (
          <>
            <LogOut className="w-3 h-3 mr-2" />
            Exit to {originalRole}
          </>
        )}
      </Button>
    </div>
  );
}