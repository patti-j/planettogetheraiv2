import { ReactNode } from "react";
import TopMenu from "@/components/top-menu";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Fixed mobile header - always the same on every page */}
      <TopMenu />
      
      {/* Main content area - scrollable below header */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}