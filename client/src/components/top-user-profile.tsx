import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LogOut, User, Settings, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "./role-switcher";
import { TrainingModeExit } from "./training-mode-exit";
import { UserProfileDialog } from "./user-profile";

export default function TopUserProfile() {
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <TooltipProvider>
      <div className="fixed top-20 left-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[280px] max-w-[320px]">
        {/* Training Mode Exit - shows when in training mode */}
        <div className="mb-3">
          <TrainingModeExit />
        </div>
        
        {/* User Info Section */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Avatar className="w-8 h-8 mr-2">
                <AvatarImage src={undefined} alt="User avatar" />
                <AvatarFallback className="text-xs">
                  {user.firstName 
                    ? user.firstName.charAt(0).toUpperCase()
                    : user.username
                    ? user.username.charAt(0).toUpperCase()
                    : <User className="w-3 h-3" />
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {user.firstName} {user.lastName}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserProfileOpen(true)}
                        className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Profile & Settings</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/settings'}
                        className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <CreditCard className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Account & Billing</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log("User profile logout button clicked");
                    logout();
                  }}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 ring-2 ring-red-200"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign out</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-xs text-gray-600 mb-2">
            Roles: {user.roles?.map(role => role.name).join(", ") || "No roles"}
          </div>
          <RoleSwitcher userId={user.id} />
        </div>
      </div>

      {/* User Profile Dialog */}
      <UserProfileDialog
        open={userProfileOpen}
        onOpenChange={setUserProfileOpen}
      />
    </TooltipProvider>
  );
}