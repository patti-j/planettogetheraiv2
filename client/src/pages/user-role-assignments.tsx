import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { UserRoleManager } from "@/components/user-role-manager";

export default function UserRoleAssignmentsPage() {
  const [isMaximized, setIsMaximized] = useState(false);

  const mainContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">User Role Assignments</h1>
          <p className="text-gray-600">Manage multiple role assignments for each user. Users can have multiple roles simultaneously.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
          className="flex items-center gap-2"
        >
          {isMaximized ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Minimize
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Maximize
            </>
          )}
        </Button>
      </div>

      {/* User Role Manager Component */}
      <UserRoleManager />
    </div>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto px-6 py-6">
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {mainContent}
    </div>
  );
}