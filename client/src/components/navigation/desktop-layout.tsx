import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { BottomDrawer } from './bottom-drawer';
import { LeftRailNav } from './left-rail-nav';
import TopMenu from '@/components/top-menu';
import { useFullScreen } from '@/contexts/FullScreenContext';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === 'desktop';
  const { isFullScreen } = useFullScreen();

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
      
      {/* Main content area with left rail and AI panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail Navigation - hidden in full screen */}
        {!isFullScreen && <LeftRailNav />}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* TopMenu for navigation menu - hidden in full screen */}
          {!isFullScreen && <TopMenu />}
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
        
        {/* AI Right Panel - hidden in full screen */}
        {!isFullScreen && <AILeftPanel />}
      </div>
      
      {/* Bottom drawer for notifications - hidden in full screen */}
      {!isFullScreen && <BottomDrawer />}
    </div>
  );
}