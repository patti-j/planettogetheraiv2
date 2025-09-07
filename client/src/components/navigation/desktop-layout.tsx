import { useState, useEffect, useRef } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { BottomDrawer } from './bottom-drawer';
import { SlideOutMenu } from './slide-out-menu';
import { MinimizedNavPanel } from './minimized-nav-panel';
import TopMenu from '@/components/top-menu';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Minimize, Send, Sparkles, Menu, Eye, EyeOff, Sidebar } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import { useLocation } from 'wouter';
import { useSplitScreen } from '@/contexts/SplitScreenContext';

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
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [isFloatingSending, setIsFloatingSending] = useState(false);
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
  const currentAiPanelSize = isAiPanelCollapsed ? 6 : aiPanelSize;
  const currentAiPanelMinSize = isAiPanelCollapsed ? 4 : 15;
  const currentAiPanelMaxSize = isAiPanelCollapsed ? 8 : 40;

  // Panel states no longer needed - panels are always visible but can be collapsed individually

  // Get AI settings for voice functionality
  const [aiSettings] = useState(() => {
    const saved = localStorage.getItem('ai-settings');
    let settings = {
      soundEnabled: false,
      voice: 'alloy',
      voiceSpeed: 1.0
    };
    
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        settings = { ...settings, ...parsedSettings };
      } catch (e) {
        // Fall back to defaults if parse fails
      }
    }
    
    return settings;
  });

  // Voice functionality for floating prompt
  const playVoiceResponse = async (text: string) => {
    if (!aiSettings.soundEnabled || !text) return;
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          text: text.substring(0, 4000), // Limit text length for TTS
          voice: aiSettings.voice || 'alloy',
          speed: aiSettings.voiceSpeed || 1.0
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      } else {
        console.error('Failed to generate speech:', response.statusText);
      }
    } catch (error) {
      console.error('Voice playback error:', error);
    }
  };

  // Floating Max AI message mutation
  const sendFloatingMessage = useMutation({
    mutationFn: async (message: string) => {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/max-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          message,
          context: {
            currentPage: location,
            selectedData: null,
            recentActions: []
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from Max AI');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsFloatingSending(false);
      
      // Add user message to chat
      addMessage({
        role: 'user',
        content: floatingPrompt,
        source: 'floating'
      });
      
      // Handle navigation actions from Max AI
      if (data?.action?.type === 'navigate' && data?.action?.target) {
        handleNavigation(data.action.target, data.action.target.replace('/', '').replace('-', ' '));
        
        // Add navigation confirmation message
        addMessage({
          role: 'assistant',
          content: data.content || `Taking you to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          source: 'floating'
        });
      } else {
        // Add assistant response
        if (data?.content || data?.message) {
          const responseContent = data.content || data.message;
          
          addMessage({
            role: 'assistant',
            content: responseContent,
            source: 'floating'
          });

          // Temporarily disabled voice response to fix looping issue
          // playVoiceResponse(responseContent);
        }
      }
      
      setFloatingPrompt('');
    },
    onError: (error: any) => {
      setIsFloatingSending(false);
      console.error("Floating Max AI Error:", error);
      
      addMessage({
        role: 'user',
        content: floatingPrompt,
        source: 'floating'
      });
      
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        source: 'floating'
      });
      
      setFloatingPrompt('');
    }
  });

  const handleFloatingSend = () => {
    if (!floatingPrompt.trim() || isFloatingSending) return;
    
    setIsFloatingSending(true);
    sendFloatingMessage.mutate(floatingPrompt);
  };

  // Handle panel size changes and persistence
  const handlePanelResize = (sizes: number[]) => {
    // Only handle AI panel size when navigation is pinned (3 panels)
    if (isNavigationPinned && sizes.length === 3) {
      const [aiSize, , navSize] = sizes; // [ai, main, nav]
      
      // Update states
      setAiPanelSize(aiSize);
      setNavPanelSize(navSize);
      
      // Save to localStorage
      try {
        localStorage.setItem('aiPanelSize', aiSize.toString());
        localStorage.setItem('navPanelSize', navSize.toString());
      } catch {
        // Ignore localStorage errors
      }
    } else if (!isNavigationPinned && sizes.length === 2) {
      // Only AI panel and main content when navigation is not pinned
      const [aiSize] = sizes;
      
      setAiPanelSize(aiSize);
      
      try {
        localStorage.setItem('aiPanelSize', aiSize.toString());
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Toggle pin functionality
  const handleTogglePin = () => {
    const newPinned = !isNavigationPinned;
    setIsNavigationPinned(newPinned);
    try {
      localStorage.setItem('navigationMenuPinned', newPinned.toString());
    } catch {
      // Ignore localStorage errors
    }
  };

  // Listen for navigation pinned state changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const pinned = localStorage.getItem('navigationMenuPinned') === 'true';
        setIsNavigationPinned(pinned);
      } catch {
        // Ignore errors
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Store reference to panel group for force updates
  const [panelGroupKey, setPanelGroupKey] = useState(0);

  // Listen for AI panel collapse state changes
  useEffect(() => {
    const handleAiPanelStorageChange = () => {
      try {
        const collapsed = localStorage.getItem('ai-panel-collapsed') === 'true';
        if (collapsed !== isAiPanelCollapsed) {
          if (!collapsed) {
            // Expanding - restore saved size immediately
            const savedSize = localStorage.getItem('aiPanelSize');
            if (savedSize) {
              const parsedSize = parseInt(savedSize);
              if (parsedSize > 0) {
                setAiPanelSize(parsedSize); // Update the AI panel size state
              }
            }
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

  // Determine if panels should be hidden - only hide on actual mobile devices (touch + small screen)
  // Never hide panels on desktop, regardless of window size
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  const isActualMobile = isTouchDevice && windowWidth < 768;
  const shouldHidePanels = isActualMobile && !forcePanelsVisible;
  
  // Check if we're on production scheduler page (which uses an iframe and shouldn't have resizable panels)
  const isProductionScheduler = location === '/production-scheduler';
  const showPanels = !isFullScreen && !shouldHidePanels && !isProductionScheduler;

  // For very small screens (actual mobile), render content directly without TopMenu
  // Only do this for screens smaller than 320px (actual mobile devices)
  if (windowWidth < 320) {
    return <>{children}</>;
  }

  // Special layout for production scheduler (iframe page)
  if (isProductionScheduler) {
    return (
      <div className="h-screen flex flex-col">
        {!isFullScreen && <CustomizableHeader />}
        <div className="flex-1 flex">
          {/* Simple AI panel for production scheduler - fixed width to avoid iframe conflicts */}
          <div className="w-80 border-r border-border bg-background">
            <AILeftPanel />
          </div>
          
          {/* Main content and navigation with resizable navigation panel */}
          {isNavigationPinned ? (
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              {/* Main content panel */}
              <ResizablePanel minSize={50}>
                <div className="flex flex-col h-full">
                  {!isFullScreen && (
                    <TopMenu 
                      onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
                      isNavPanelOpen={isNavigationOpen}
                    />
                  )}
                  <div className="flex-1 overflow-auto">
                    {children}
                  </div>
                </div>
              </ResizablePanel>
              
              {/* Resizable handle for navigation panel */}
              <ResizableHandle 
                withHandle 
                className="w-6 bg-blue-600 hover:bg-blue-700 transition-all duration-200 cursor-col-resize border-2 border-blue-800 hover:border-blue-900 relative z-50"
                style={{ 
                  background: '#2563eb',
                  boxShadow: '0 0 10px rgba(37, 99, 235, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.2)', 
                  minWidth: '24px'
                }}
              >
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  <div className="w-1 h-4 bg-white rounded-full opacity-90" />
                  <div className="w-1 h-4 bg-white rounded-full opacity-90" />
                  <div className="w-1 h-4 bg-white rounded-full opacity-90" />
                </div>
              </ResizableHandle>
              
              {/* Navigation panel - resizable */}
              <ResizablePanel 
                defaultSize={navPanelSize} 
                minSize={15} 
                maxSize={35}
                className="min-w-0"
              >
                <div className="h-full flex flex-col bg-background border-l border-border">
                  <SlideOutMenu 
                    isOpen={true}
                    onClose={() => {}}
                    width={undefined}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            /* Main content only when navigation is not pinned */
            <div className="flex-1 flex flex-col">
              {!isFullScreen && (
                <TopMenu 
                  onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
                  isNavPanelOpen={isNavigationOpen}
                />
              )}
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
            <ResizableHandle withHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />
            
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
                
                {/* Main content area - with bottom padding for activity center */}
                <div className="flex-1 overflow-auto pb-10">
                  {children}
                </div>
              </div>
            </ResizablePanel>
            
            {/* Resizable handle for navigation panel */}
            <ResizableHandle 
              withHandle 
              className="w-6 bg-blue-600 hover:bg-blue-700 transition-all duration-200 cursor-col-resize border-2 border-blue-800 hover:border-blue-900 relative z-50"
              style={{ 
                background: '#2563eb',
                boxShadow: '0 0 10px rgba(37, 99, 235, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.2)', 
                minWidth: '24px'
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <div className="w-1 h-4 bg-white rounded-full opacity-90" />
                <div className="w-1 h-4 bg-white rounded-full opacity-90" />
                <div className="w-1 h-4 bg-white rounded-full opacity-90" />
              </div>
            </ResizableHandle>
            
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
              <ResizableHandle withHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />
              
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
                  
                  {/* Main content area - with bottom padding for activity center */}
                  <div className="flex-1 overflow-auto pb-10">
                    {children}
                  </div>
                </div>
              </ResizablePanel>
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
          
          {/* Main content area - with bottom padding for activity center */}
          <div className="flex-1 overflow-auto pb-10">
            {children}
          </div>
        </div>
      )}
      
      {/* Bottom drawer for notifications - hidden in full screen */}
      {!isFullScreen && <BottomDrawer />}

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
      
      {/* Floating Max AI Prompt - always visible, positioned higher to avoid Activity Center */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-0.5 rounded-full shadow-lg backdrop-blur-sm">
          <div className="bg-background rounded-full p-2 flex items-center gap-2 min-w-[280px] max-w-[400px]">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <Input
              placeholder="Ask anything"
              value={floatingPrompt}
              onChange={(e) => setFloatingPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFloatingSend()}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground"
              disabled={isFloatingSending}
            />
            <Button
              onClick={handleFloatingSend}
              size="sm"
              variant="ghost"
              className="rounded-full w-8 h-8 p-0 hover:bg-muted flex-shrink-0"
              disabled={!floatingPrompt.trim() || isFloatingSending}
            >
              {isFloatingSending ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

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