import { usePermissions, useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  feature?: string;
  action?: string;
  permissions?: Array<{ feature: string; action: string }>;
  role?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  feature, 
  action, 
  permissions,
  role,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  let hasAccess = false;

  console.log('🔐 ProtectedRoute Check:', {
    feature,
    action,
    permissions,
    role,
    isLoading,
    userExists: !!user
  });

  // Only show loading state on TRUE initial load when there's no user data
  // Don't show loading during refetches when we already have cached user data
  // This prevents blank screens during navigation
  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated at all, they shouldn't see "Access Denied" but should be redirected to login
  // BUT: Only redirect if we're sure auth has finished loading and there's genuinely no user
  if (!user && !isLoading) {
    // Check if there's a token in localStorage - if yes, don't redirect (auth might be reloading)
    const hasToken = localStorage.getItem('auth_token');
    if (!hasToken) {
      // No token and no user - genuinely not authenticated
      window.location.href = '/login';
      return null;
    } else {
      // Has token but user not loaded yet - wait for auth to complete
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying authentication...</p>
          </div>
        </div>
      );
    }
  }

  if (role) {
    hasAccess = hasRole(role);
  } else if (permissions) {
    hasAccess = hasAnyPermission(permissions);
  } else if (feature && action) {
    hasAccess = hasPermission(feature, action);
  } else {
    // No restrictions, allow access
    hasAccess = true;
  }

  console.log('🔐 ProtectedRoute Result:', { hasAccess });

  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this feature. Please contact your administrator if you believe this is an error.
            </p>
            <div className="text-sm text-gray-500">
              {feature && action && (
                <p>Required permission: {feature} - {action}</p>
              )}
              {role && (
                <p>Required role: {role}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}