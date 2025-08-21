import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface DemoAccount {
  username: string;
  role: string;
  name: string;
  access: string;
}

interface DemoAccountsCardProps {
  demoAccounts: DemoAccount[];
  onSelectAccount: (username: string) => void;
}

export const DemoAccountsCard: React.FC<DemoAccountsCardProps> = ({ demoAccounts, onSelectAccount }) => {
  return (
    <Card className="w-full">
      <CardHeader className="px-4 pb-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Demo Accounts</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Quick access with demo credentials</CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <Button
              key={account.username}
              variant="outline"
              className="h-auto p-2 sm:p-3 flex flex-col items-start text-left hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => onSelectAccount(account.username)}
            >
              <div className="flex items-center gap-2 w-full">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                <span className="font-medium text-xs sm:text-sm">{account.role}</span>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500 mt-1">{account.name}</span>
              <span className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 line-clamp-1">{account.access}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};