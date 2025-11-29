import { useState, useEffect, useRef } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { SlideOutMenu } from './slide-out-menu';
import { MinimizedNavPanel } from './minimized-nav-panel';
import TopMenu from '@/components/top-menu';
import IntegratedAIAssistant from '@/components/integrated-ai-assistant';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minimize, Send, Sparkles, Menu, Eye, EyeOff, Sidebar, ChevronDown, Calendar, Factory, Shield, Package, Users, Maximize, Mic, MicOff, Paperclip, StopCircle, Wrench, TrendingUp, Layers } from 'lucide-react';
import { getActiveAgents } from '@/config/agents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import { useLocation } from 'wouter';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAgent } from '@/contexts/AgentContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === 'desktop';
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const { user } = useAuth();
  const { addMessage } = useChatSync();
  const [location, setLocation] = useLocation();
  const { handleNavigation } = useSplitScreen();
  const { setCanvasVisible, setCanvasItems, maxOpen } = useMaxDock();
  const { currentAgent, switchToAgent } = useAgent();
  const { toast } = useToast();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  
  // Panel force-show state for small screens
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [forcePanelsVisible, setForcePanelsVisible] = useState(false);
  
  // Check if navigation is pinned
  const [isNavigationPinned, setIsNavigationPinned] = useState(() => {
    try {
      return localStorage.getItem('navigationMenuPinned') === 'true';
    } catch {
      return false;
    }
  });

  // Panel width states for resizable panels
  const [aiPanelSize, setAiPanelSize] = useState(() => {
    try {
      const savedSize = localStorage.getItem('aiPanelSize');
      return savedSize ? parseInt(savedSize) : 25; // Default 25% of screen width
    } catch {
      return 25;
    }
  });
  
  const [navPanelSize, setNavPanelSize] = useState(() => {
    try {
      const savedSize = localStorage.getItem('navPanelSize');
      return savedSize ? parseInt(savedSize) : 20; // Default 20% of screen width
    } catch {
      return 20;
    }
  });

  // Track AI panel collapse state
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ai-panel-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Note: aiPanelRef no longer needed with direct state management

  // Calculate dynamic AI panel size based on collapse state
  // When expanding, read directly from localStorage to avoid state timing issues
  const currentAiPanelSize = isAiPanelCollapsed ? 6 : (() => {
    try {
      const savedSize = localStorage.getItem('aiPanelSize');
      if (savedSize) {
        const parsedSize = parseInt(savedSize);
        // Enforce minimum 25% width - clamp any smaller saved values
        if (parsedSize >= 25) {
          return parsedSize;
        } else if (parsedSize >= 15) {
          // Update localStorage to the new minimum if old saved size was too narrow
          localStorage.setItem('aiPanelSize', '25');
          return 25;
        }
      }
    } catch {}
    return 25; // Default to 25% if no valid saved size
  })();
  const currentAiPanelMinSize = isAiPanelCollapsed ? 4 : 25;
  const currentAiPanelMaxSize = isAiPanelCollapsed ? 8 : 40;

  // Debug logging will be added after variables are defined

  // Panel states no longer needed - panels are always visible but can be collapsed individually

  // Handle panel size changes and persistence
  const handlePanelResize = (sizes: number[]) => {
    // Only handle AI panel size when navigation is pinned (3 panels)
    if (isNavigationPinned && sizes.length === 3) {
      const [aiSize, , navSize] = sizes;
      setAiPanelSize(aiSize);
      setNavPanelSize(navSize);
      try {
        localStorage.setItem('aiPanelSize', aiSize.toString());
        localStorage.setItem('navPanelSize', navSize.toString());
      } catch {}
    } else if (!isNavigationPinned && sizes.length === 2) {
      const [aiSize] = sizes;
      setAiPanelSize(aiSize);
      try {
        localStorage.setItem('aiPanelSize', aiSize.toString());
      } catch {}
    }
  };

  // Toggle pin functionality
  const handleTogglePin = () => {
    const newPinned = !isNavigationPinned;
    setIsNavigationPinned(newPinned);
    try {
      localStorage.setItem('navigationMenuPinned', newPinned.toString());
    } catch {}
  };

  // Listen for navigation pinned state changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const pinned = localStorage.getItem('navigationMenuPinned') === 'true';
        setIsNavigationPinned(pinned);
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Window resize handler for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get active agents for selection
  const activeAgents = getActiveAgents();

  // Store reference to panel group for force updates
  const [panelGroupKey, setPanelGroupKey] = useState(0);

  // Listen for AI panel collapse state changes
  useEffect(() => {
    const handleAiPanelStorageChange = () => {
      try {
        const collapsed = localStorage.getItem('ai-panel-collapsed') === 'true';
        if (collapsed !== isAiPanelCollapsed) {
          if (!collapsed) {
            // Expanding - restore saved size with minimum 25% for proper visibility
            const savedSize = localStorage.getItem('aiPanelSize');
            let targetSize = 25; // Default to 25%
            
            if (savedSize) {
              const parsedSize = parseInt(savedSize);
              if (parsedSize >= 15) {
                targetSize = parsedSize; // Use saved size if it's reasonable
              }
            }
            
            setAiPanelSize(targetSize);
            
            // Force panel group to refresh layout
            setPanelGroupKey(prev => prev + 1);
          } else {
            // Collapsing - save current size for later restoration
            localStorage.setItem('aiPanelSize', aiPanelSize.toString());
          }
          setIsAiPanelCollapsed(collapsed);
        }
      } catch {
        // Ignore errors
      }
    };
    
    window.addEventListener('storage', handleAiPanelStorageChange);
    const interval = setInterval(handleAiPanelStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleAiPanelStorageChange);
      clearInterval(interval);
    };
  }, [isAiPanelCollapsed, aiPanelSize]);

  // Track window width for responsive panel hiding
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Reset force-show when going back to larger screen
      if (window.innerWidth >= 768) {
        setForcePanelsVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add keyboard support for exiting fullscreen with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        toggleFullScreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, toggleFullScreen]);

  // Focus the floating input when the bubble expands
  useEffect(() => {
    if (!isFloatingBubbleMinimized && floatingInputRef.current) {
      floatingInputRef.current.focus();
    }
  }, [isFloatingBubbleMinimized]);

  // MEMORY LEAK FIX: Clean up voice recording resources on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up voice recording resources on unmount...');
      
      // Stop any active recording
      if (floatingMediaRecorder && floatingMediaRecorder.state === 'recording') {
        try {
          floatingMediaRecorder.stop();
        } catch (err) {
          console.log('Error stopping MediaRecorder:', err);
        }
      }
      
      // Clear all timers
      if (floatingRecordingTimeout) {
        clearTimeout(floatingRecordingTimeout);
      }
      if (floatingSilenceTimerRef.current) {
        clearTimeout(floatingSilenceTimerRef.current);
      }
      
      // Stop Web Speech API
      if (floatingRecognitionRef.current) {
        try {
          floatingRecognitionRef.current.stop();
          floatingRecognitionRef.current = null;
        } catch (err) {
          console.log('Error stopping Web Speech API:', err);
        }
      }
      
      // Clear audio chunks to free memory
      floatingAudioChunksRef.current = [];
      
      // Clear text refs
      floatingLastTranscriptRef.current = '';
      floatingAccumulatedTextRef.current = '';
      
      // Clear attachments to free memory
      setFloatingAttachments([]);
      
      // Release MediaRecorder and stream
      if (floatingMediaRecorder) {
        const stream = floatingMediaRecorder.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setFloatingMediaRecorder(null);
      }
    };
  }, [floatingMediaRecorder, floatingRecordingTimeout]);

  // Determine if panels should be hidden - only hide on actual mobile devices (touch + small screen)
  // Never hide panels on desktop, regardless of window size
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  const isActualMobile = isTouchDevice && windowWidth < 768;
  const shouldHidePanels = isActualMobile && !forcePanelsVisible;
  
  // Show panels normally (removed special case for production scheduler)
  const showPanels = !isFullScreen && !shouldHidePanels;
  
  // VERY OBVIOUS DEBUG LOGGING
  console.log('🚨🚨🚨 DESKTOP LAYOUT IS RENDERING 🚨🚨🚨');
  console.log('🐛 Desktop Layout Debug:', {
    showPanels,
    isNavigationPinned,
    currentAiPanelSize,
    aiPanelSize,
    isAiPanelCollapsed,
    location,
    windowWidth,
    isFullScreen
  });
  console.log('🚨🚨🚨 END DESKTOP LAYOUT DEBUG 🚨🚨🚨');

  // For very small screens (actual mobile), render content directly without TopMenu
  // Only do this for screens smaller than 320px (actual mobile devices)
  if (windowWidth < 320) {
    return <>{children}</>;
  }

  // For desktop, use the new enhanced navigation components
  return (
    <div className="h-screen flex flex-col">
      
      {/* Customizable desktop header - hidden in full screen */}
      {!isFullScreen && (
        <CustomizableHeader />
      )}
      
      {/* Main content area with resizable AI panel on left and navigation on right */}
      {showPanels ? (
        isNavigationPinned ? (
          /* Layout with AI panel, main content, and pinned navigation (3 panels) */
          <>
          <ResizablePanelGroup 
            direction="horizontal" 
            className="flex-1 overflow-hidden"
            onLayout={handlePanelResize}
          >
            {/* AI Panel - resizable left panel */}
            <ResizablePanel 
              defaultSize={currentAiPanelSize} 
              minSize={currentAiPanelMinSize} 
              maxSize={currentAiPanelMaxSize}
              className="min-w-0"
            >
              <AILeftPanel />
            </ResizablePanel>
            
            {/* Resizable handle for AI panel */}
            <ResizableHandle withHandle className="w-[1px] bg-border/80 hover:bg-primary/20 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
            
            {/* Main content panel */}
            <ResizablePanel minSize={30}>
              <div className="flex flex-col h-full">
                
                {/* TopMenu for navigation menu - hidden in full screen */}
                {!isFullScreen && (
                  <TopMenu 
                    onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
                    isNavPanelOpen={isNavigationOpen}
                  />
                )}
                
                {/* Main content area */}
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </div>
            </ResizablePanel>
            
            {/* Max Panel - conditionally show when maxOpen is true */}
            {maxOpen && (
              <>
                <ResizableHandle withHandle className="w-[1px] bg-border/80 hover:bg-primary/20 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
                <ResizablePanel 
                  defaultSize={35} 
                  minSize={25} 
                  maxSize={50}
                  className="min-w-0 h-full"
                >
                  <IntegratedAIAssistant />
                </ResizablePanel>
              </>
            )}
            
            {/* Resizable handle for navigation panel */}
            <ResizableHandle withHandle className="w-[6px] bg-gradient-to-r from-border/40 via-border/60 to-border/40 hover:from-primary/15 hover:via-primary/25 hover:to-primary/15 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
            
            {/* Navigation panel - resizable */}
            <ResizablePanel 
              defaultSize={Math.max(navPanelSize, 15)} 
              minSize={15} 
              maxSize={35}
              className="min-w-0"
            >
              <div className="h-full flex flex-col bg-background border-l border-border">
                <SlideOutMenu 
                  isOpen={true}
                  onClose={() => {}}
                  width={undefined} // Let panel handle width
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          </>
        ) : (
          /* Layout with AI panel and main content only (2 panels) */
          <div className="flex flex-1 overflow-hidden">
            <ResizablePanelGroup 
              direction="horizontal" 
              className="flex-1 overflow-hidden"
              onLayout={handlePanelResize}
            >
              {/* AI Panel - resizable left panel */}
              <ResizablePanel 
                defaultSize={currentAiPanelSize} 
                minSize={currentAiPanelMinSize} 
                maxSize={currentAiPanelMaxSize}
                className="min-w-0"
              >
                <AILeftPanel />
              </ResizablePanel>
              
              {/* Resizable handle for AI panel */}
              <ResizableHandle withHandle className="w-[1px] bg-border/80 hover:bg-primary/20 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
              
              {/* Main content panel */}
              <ResizablePanel minSize={30}>
                <div className="flex flex-col h-full">
                  
                  {/* TopMenu for navigation menu - hidden in full screen */}
                  {!isFullScreen && (
                    <TopMenu 
                      onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
                      isNavPanelOpen={isNavigationOpen}
                    />
                  )}
                  
                  {/* Main content area */}
                  <div className="flex-1 overflow-auto">
                    {children}
                  </div>
                </div>
              </ResizablePanel>
              
              {/* Max Panel - conditionally show when maxOpen is true */}
              {maxOpen && (
                <>
                  <ResizableHandle withHandle className="w-[1px] bg-border/80 hover:bg-primary/20 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
                  <ResizablePanel 
                    defaultSize={35} 
                    minSize={25} 
                    maxSize={50}
                    className="min-w-0 h-full"
                  >
                    <IntegratedAIAssistant />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
            
            {/* Minimized Navigation Panel - positioned absolutely */}
            <MinimizedNavPanel 
              onExpand={() => setIsNavigationOpen(true)}
              isPinned={isNavigationPinned}
              onTogglePin={handleTogglePin}
            />
          </div>
        )
      ) : (
        /* Fallback layout when panels are hidden */
        <div className="flex-1 flex flex-col">
          {/* TopMenu for navigation menu - hidden in full screen */}
          {!isFullScreen && (
            <TopMenu 
              onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
              isNavPanelOpen={isNavigationOpen}
            />
          )}
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      )}
      

      {/* Panel Toggle Button - Show when panels are hidden due to mobile device */}
      {!isFullScreen && shouldHidePanels && (
        <div className="fixed top-4 left-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setForcePanelsVisible(!forcePanelsVisible)}
                  size="sm"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-muted"
                >
                  <Sidebar className="h-4 w-4 mr-2" />
                  Show Panels
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Show navigation and AI panels</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Panel Hide Button - Show when panels are force-visible on mobile */}
      {!isFullScreen && forcePanelsVisible && isActualMobile && (
        <div className="fixed top-4 left-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setForcePanelsVisible(false)}
                  size="sm"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-muted"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Panels
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Hide panels to see more content</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Floating Exit Fullscreen Button - only visible in fullscreen mode */}
      {isFullScreen && (
        <div className="fixed top-4 right-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleFullScreen}
                  size="sm"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-muted flex items-center gap-2"
                  data-testid="button-exit-fullscreen"
                >
                  <Minimize className="h-4 w-4" />
                  <span className="text-sm font-medium">Exit Fullscreen</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Exit fullscreen mode (or press Escape)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Global Navigation Menu - only show when not pinned */}
      {!isNavigationPinned && !isFullScreen && (
        <SlideOutMenu 
          isOpen={isNavigationOpen}
          onClose={() => setIsNavigationOpen(false)}
          width={undefined} // Use default width for overlay mode
        />
      )}
    </div>
  );
}