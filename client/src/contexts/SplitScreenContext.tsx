import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, SplitSquareHorizontal } from 'lucide-react';

export type SplitMode = 'none' | 'horizontal' | 'vertical';
export type NavigationTarget = 'primary' | 'secondary';

interface SplitScreenContextType {
  splitMode: SplitMode;
  setSplitMode: (mode: SplitMode) => void;
  primaryPage: string;
  setPrimaryPage: (page: string) => void;
  secondaryPage: string;
  setSecondaryPage: (page: string) => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  navigationTarget: NavigationTarget;
  setNavigationTarget: (target: NavigationTarget) => void;
  // New method for handling navigation that might trigger pane selection
  handleNavigation: (path: string, label: string) => void;
  // State for pane selection dialog
  showPaneSelector: boolean;
  setShowPaneSelector: (show: boolean) => void;
  pendingNavigation: { path: string; label: string } | null;
  setPendingNavigation: (nav: { path: string; label: string } | null) => void;
}

const SplitScreenContext = createContext<SplitScreenContextType | undefined>(undefined);

interface SplitScreenProviderProps {
  children: ReactNode;
}

export function SplitScreenProvider({ children }: SplitScreenProviderProps) {
  const [location, setLocation] = useLocation();
  const [splitMode, setSplitMode] = useState<SplitMode>('none');
  const [primaryPage, setPrimaryPage] = useState('/dashboard');
  const [secondaryPage, setSecondaryPage] = useState('/analytics');
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for first pane
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget>('primary');
  
  // New state for pane selection dialog
  const [showPaneSelector, setShowPaneSelector] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ path: string; label: string } | null>(null);

  // CRITICAL FIX: Sync primaryPage with current location when route changes
  // This prevents blank screens when navigating out of split-mode pages
  useEffect(() => {
    if (location !== primaryPage && location !== secondaryPage) {
      // Location changed to a page not in either pane - update primaryPage
      setPrimaryPage(location);
    }
  }, [location, primaryPage, secondaryPage]);

  // New method for handling navigation that might trigger pane selection
  const handleNavigation = (path: string, label: string) => {
    try {
      // Save current page before navigating to agent pages (for back button)
      const agentPages = ['/canvas', '/playbooks', '/agent-history', '/ai-insights'];
      if (agentPages.includes(path)) {
        const currentPath = window.location.pathname;
        if (!agentPages.includes(currentPath)) {
          sessionStorage.setItem('previousPage', currentPath);
        }
      }
      
      if (splitMode !== 'none') {
        // Check if this path is already displayed in either pane
        if (path === primaryPage || path === secondaryPage) {
          // Already displayed, just navigate normally using React router
          setLocation(path);
          return;
        }
        
        // New page in split mode - show pane selector WITHOUT navigating
        setPendingNavigation({ path, label });
        setShowPaneSelector(true);
      } else {
        // Single pane mode - navigate normally using React router
        setLocation(path);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // If navigation fails, try simple setLocation as fallback
      setLocation(path);
    }
  };

  // Handle pane selection
  const handlePaneSelection = (target: 'primary' | 'secondary') => {
    if (pendingNavigation) {
      if (target === 'primary') {
        // For primary pane, navigate to the page (since primary shows current route)
        setPrimaryPage(pendingNavigation.path);
        setLocation(pendingNavigation.path);
      } else {
        // For secondary pane, just update the secondaryPage state
        setSecondaryPage(pendingNavigation.path);
      }
      setNavigationTarget(target);
    }
    setShowPaneSelector(false);
    setPendingNavigation(null);
  };

  // Cancel pane selection
  const handleCancelPaneSelection = () => {
    setShowPaneSelector(false);
    setPendingNavigation(null);
  };

  return (
    <SplitScreenContext.Provider
      value={{
        splitMode,
        setSplitMode,
        primaryPage,
        setPrimaryPage,
        secondaryPage,
        setSecondaryPage,
        splitRatio,
        setSplitRatio,
        navigationTarget,
        setNavigationTarget,
        handleNavigation,
        showPaneSelector,
        setShowPaneSelector,
        pendingNavigation,
        setPendingNavigation,
      }}
    >
      {children}
      
      {/* Pane Selection Dialog */}
      <Dialog open={showPaneSelector} onOpenChange={(open) => {
        if (!open) {
          handleCancelPaneSelection();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Split Screen Pane</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're viewing {pendingNavigation?.label || 'a page'} in split screen mode. 
              Which pane should display this content?
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => handlePaneSelection('primary')}
              >
                <Monitor className="h-6 w-6" />
                {splitMode === 'vertical' ? 'Top Pane' : 'Left Pane'}
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => handlePaneSelection('secondary')}
              >
                <SplitSquareHorizontal className="h-6 w-6" />
                {splitMode === 'vertical' ? 'Bottom Pane' : 'Right Pane'}
              </Button>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancelPaneSelection}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SplitScreenContext.Provider>
  );
}

export function useSplitScreen() {
  const context = useContext(SplitScreenContext);
  if (context === undefined) {
    throw new Error('useSplitScreen must be used within a SplitScreenProvider');
  }
  return context;
}