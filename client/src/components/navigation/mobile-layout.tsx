import { ReactNode } from "react";
import TopMenu from "@/components/top-menu";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Main content area - scrollable above footer */}
      <div className="flex-1 overflow-y-auto pb-16">
        {children}
      </div>
      
      {/* Fixed mobile footer bar - always the same on every page */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]">
        <TopMenu />
      </div>
    </div>
  );
}