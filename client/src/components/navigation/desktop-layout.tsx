import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { BottomDrawer } from './bottom-drawer';
import { LeftRailNav } from './left-rail-nav';
import TopMenu from '@/components/top-menu';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Minimize } from 'lucide-react';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === 'desktop';
  const { isFullScreen, toggleFullScreen } = useFullScreen();

  // For mobile, render content directly without TopMenu
  // Mobile pages should handle their own navigation
  if (!isDesktop) {
    return <>{children}</>;
  }

  // For desktop, use the new enhanced navigation components
  return (
    <div className="h-screen flex flex-col">
      
      {/* Customizable desktop header - hidden in full screen */}
      {!isFullScreen && <CustomizableHeader />}
      
      {/* Main content area with AI panel on left and navigation on right */}
      <div className="flex flex-1 overflow-hidden">
        {/* AI Panel - now on the left side - hidden in full screen */}
        {!isFullScreen && <AILeftPanel />}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* TopMenu for navigation menu - hidden in full screen */}
          {!isFullScreen && <TopMenu />}
          
          {/* Main content area - with bottom padding for activity center */}
          <div className="flex-1 overflow-auto pb-10">
            {children}
          </div>
        </div>
        
        {/* Navigation Rail - now on the right side - hidden in full screen */}
        {!isFullScreen && <LeftRailNav />}
      </div>
      
      {/* Bottom drawer for notifications - hidden in full screen */}
      {!isFullScreen && <BottomDrawer />}
    </div>
  );
}