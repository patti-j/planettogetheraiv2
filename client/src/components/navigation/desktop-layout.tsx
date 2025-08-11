import { useDeviceType } from '@/hooks/useDeviceType';
import { DesktopTopBar } from './desktop-top-bar';
import { AILeftPanel } from './ai-left-panel';
import { BottomDrawer } from './bottom-drawer';
import TopMenu from '@/components/top-menu';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === 'desktop';

  // For mobile, keep the existing layout
  if (!isDesktop) {
    return (
      <>
        <TopMenu />
        {children}
      </>
    );
  }

  // For desktop, use the new enhanced navigation components
  return (
    <div className="h-screen flex flex-col">
      {/* New desktop top bar */}
      <DesktopTopBar />
      
      {/* Main content area with AI panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* AI Left Panel */}
        <AILeftPanel />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Legacy TopMenu for compatibility (hidden on desktop with new nav) */}
          <div className="hidden">
            <TopMenu />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
      
      {/* Bottom drawer for notifications */}
      <BottomDrawer />
    </div>
  );
}