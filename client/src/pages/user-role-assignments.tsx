import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Users } from "lucide-react";
import { UserRoleManager } from "@/components/user-role-manager";

export default function UserRoleAssignmentsPage() {
  const [isMaximized, setIsMaximized] = useState(false);

  const mainContent = (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            User Role Assignments
          </h1>
          <p className="text-sm md:text-base text-gray-600">Manage multiple role assignments for each user. Users can have multiple roles simultaneously.</p>
        </div>
        
        {/* Maximize button always in top right corner */}
        <div className="absolute top-0 right-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Role Manager Component */}
      <UserRoleManager />
    </div>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto">
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {mainContent}
    </div>
  );
}