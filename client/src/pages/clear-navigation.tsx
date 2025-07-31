import React, { useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function ClearNavigation() {
  const { clearRecentPages } = useNavigation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const clearStoredNavigation = async () => {
      if (user?.id) {
        try {
          // Clear stored navigation preferences
          const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
          const currentPreferences = await response.json();
          
          // Remove lastVisitedRoute from preferences
          const updatedDashboardLayout = {
            ...currentPreferences.dashboardLayout,
            lastVisitedRoute: null
          };
          
          await apiRequest('PUT', `/api/user-preferences`, {
            dashboardLayout: updatedDashboardLayout
          });
          
          console.log('Cleared stored navigation preferences');
        } catch (error) {
          console.error('Failed to clear navigation preferences:', error);
        }
      }
      
      // Clear recent pages
      clearRecentPages();
      
      // Redirect to homepage
      setTimeout(() => {
        setLocation('/');
      }, 100);
    };

    clearStoredNavigation();
  }, [user, clearRecentPages, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Clearing navigation preferences...</p>
      </div>
    </div>
  );
}