import { usePermissions } from "@/hooks/useAuth";

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
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  let hasAccess = false;

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