import { useState, useEffect, useRef } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { SlideOutMenu } from './slide-out-menu';
import { MinimizedNavPanel } from './minimized-nav-panel';
import TopMenu from '@/components/top-menu';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minimize, Send, Sparkles, Menu, Eye, EyeOff, Sidebar, ChevronDown, Calendar, Factory, Shield, Package, Users, Maximize, Mic, MicOff, Paperclip, StopCircle } from 'lucide-react';
import { getActiveAgents } from '@/config/agents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import { useLocation } from 'wouter';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useMaxDock } from '@/contexts/MaxDockContext';
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
  const { setCanvasVisible } = useMaxDock();
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [isFloatingSending, setIsFloatingSending] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isFloatingBubbleMinimized, setIsFloatingBubbleMinimized] = useState(false);
  const [selectedFloatingAgent, setSelectedFloatingAgent] = useState<string>('unified');
  const floatingInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording state for floating bubble
  const [isFloatingRecording, setIsFloatingRecording] = useState(false);
  const [floatingMediaRecorder, setFloatingMediaRecorder] = useState<MediaRecorder | null>(null);
  const [floatingRecordingTimeout, setFloatingRecordingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [floatingRecordingTimeLeft, setFloatingRecordingTimeLeft] = useState<number>(0);
  const [isFloatingTranscribing, setIsFloatingTranscribing] = useState(false);
  
  // File attachment state for floating bubble
  const [floatingAttachments, setFloatingAttachments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    content?: string;
    url?: string;
    file: File;
  }>>([]);
  const [isFloatingProcessingFiles, setIsFloatingProcessingFiles] = useState(false);
  const floatingFileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Calculate dynamic AI panel size based on collapse state - fix config error
  const currentAiPanelSize = isAiPanelCollapsed ? 6 : Math.max(aiPanelSize, 15);
  const currentAiPanelMinSize = isAiPanelCollapsed ? 4 : 15;
  const currentAiPanelMaxSize = isAiPanelCollapsed ? 8 : 40;

  // Debug logging will be added after variables are defined

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
      const authToken = localStorage.getItem('auth_token');
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
      const authToken = localStorage.getItem('auth_token');
      
      // Determine endpoint based on selected agent
      let endpoint = '/api/max-ai/chat';
      let requestBody: any = {
        message,
        context: {
          currentPage: location,
          selectedData: null,
          recentActions: []
        }
      };

      if (selectedFloatingAgent === 'scheduling_assistant') {
        endpoint = '/api/ai/schedule/chat';
        requestBody = { message: { role: 'user', content: message, source: 'floating' } };
      } else if (selectedFloatingAgent === 'unified') {
        // Use Max AI with unified routing indicator
        requestBody.context.agentMode = 'unified';
      } else if (selectedFloatingAgent !== 'max') {
        // For other specific agents, add agent context to Max AI
        requestBody.context.targetAgent = selectedFloatingAgent;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get response from ${selectedFloatingAgent === 'unified' ? 'AI agents' : 'selected agent'}`);
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsFloatingSending(false);
      
      // Determine which agent responded
      const respondingAgent = selectedFloatingAgent === 'unified' ? 
        (data?.agentId || 'max') : selectedFloatingAgent;
      
      // Add user message to chat with agent context
      addMessage({
        role: 'user',
        content: floatingPrompt,
        source: 'floating',
        agentId: respondingAgent
      });
      
      // Handle navigation actions from Max AI
      if (data?.action?.type === 'navigate' && data?.action?.target) {
        handleNavigation(data.action.target, data.action.target.replace('/', '').replace('-', ' '));
        
        // Add navigation confirmation message
        addMessage({
          role: 'assistant',
          content: data.content || `Taking you to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          source: 'floating',
          agentId: respondingAgent
        });
      } else if (data?.action?.type === 'create_chart') {
        // Handle chart creation actions - navigate to canvas
        console.log('Floating AI - Chart creation detected, navigating to canvas');
        setLocation('/canvas');
        
        // Add chart creation confirmation message
        addMessage({
          role: 'assistant',
          content: data.content || 'I\'ve created a chart for you and added it to the canvas.',
          source: 'floating',
          agentId: respondingAgent
        });
      } else {
        // Add assistant response
        if (data?.content || data?.message || data?.response) {
          const responseContent = data.content || data.message || data.response;
          
          addMessage({
            role: 'assistant',
            content: responseContent,
            source: 'floating',
            agentId: respondingAgent
          });

          // Temporarily disabled voice response to fix looping issue
          // playVoiceResponse(responseContent);
        }
      }
      
      setFloatingPrompt('');
    },
    onError: (error: any) => {
      setIsFloatingSending(false);
      console.error("Floating AI Error:", error);
      
      addMessage({
        role: 'user',
        content: floatingPrompt,
        source: 'floating',
        agentId: selectedFloatingAgent
      });
      
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        source: 'floating',
        agentId: selectedFloatingAgent
      });
      
      setFloatingPrompt('');
    }
  });

  const handleFloatingSend = () => {
    if (!floatingPrompt.trim() || isFloatingSending) return;
    
    setIsFloatingSending(true);
    sendFloatingMessage.mutate(floatingPrompt);
  };

  // Voice recording handlers for floating bubble
  const startFloatingListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        await handleFloatingAudioRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setFloatingMediaRecorder(recorder);
      setIsFloatingRecording(true);
      setFloatingRecordingTimeLeft(10);

      // Start countdown timer
      const interval = setInterval(() => {
        setFloatingRecordingTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            stopFloatingListening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        stopFloatingListening();
      }, 10000);

      setFloatingRecordingTimeout(timeout);
    } catch (error) {
      console.error('Floating recording error:', error);
    }
  };

  const stopFloatingListening = () => {
    if (floatingMediaRecorder && floatingMediaRecorder.state === 'recording') {
      floatingMediaRecorder.stop();
    }
    if (floatingRecordingTimeout) {
      clearTimeout(floatingRecordingTimeout);
      setFloatingRecordingTimeout(null);
    }
    setIsFloatingRecording(false);
    setFloatingRecordingTimeLeft(0);
  };

  const handleFloatingAudioRecording = async (audioBlob: Blob) => {
    setIsFloatingTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const authToken = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/whisper-transcribe', {
        method: 'POST',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          setFloatingPrompt(data.transcript);
          // Auto-send the transcribed message
          setTimeout(() => {
            setFloatingPrompt(data.transcript);
            sendFloatingMessage.mutate(data.transcript);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsFloatingTranscribing(false);
    }
  };

  // File attachment handlers for floating bubble
  const handleFloatingFileUpload = () => {
    floatingFileInputRef.current?.click();
  };

  const handleFloatingFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsFloatingProcessingFiles(true);

    try {
      const items = await Promise.all(Array.from(files).map(async (file) => {
        const id = Date.now() + Math.random().toString();
        
        // Read file content for text files
        let content: string | undefined;
        let url: string | undefined;

        if (file.type.startsWith('text/') || file.type === 'application/json') {
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.readAsText(file);
          });
        } else if (file.type.startsWith('image/')) {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.readAsDataURL(file);
          });
        }

        return { id, name: file.name, type: file.type, size: file.size, content, url, file };
      }));
      
      setFloatingAttachments(prev => [...prev, ...items]);
    } catch (err) {
      console.error('Error processing files:', err);
    } finally {
      setIsFloatingProcessingFiles(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeFloatingAttachment = (id: string) => {
    setFloatingAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Helper function to get agent icon
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'max': return Sparkles;
      case 'scheduling_assistant': return Calendar;
      case 'production_scheduling': return Calendar;
      case 'shop_floor': return Factory;
      case 'quality_management': return Shield;
      case 'unified': return Users;
      default: return Sparkles;
    }
  };

  // Get active agents for selection
  const activeAgents = getActiveAgents();
  const unifiedOption = { id: 'unified', name: 'Unified Discussion', displayName: 'All Agents' };

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

  // Focus the floating input when the bubble expands
  useEffect(() => {
    if (!isFloatingBubbleMinimized && floatingInputRef.current) {
      floatingInputRef.current.focus();
    }
  }, [isFloatingBubbleMinimized]);

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
      
      {/* Floating Max AI Prompt - toggles between minimized circle and expanded oval */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50">
        {isFloatingBubbleMinimized ? (
          // Minimized circular icon
          <Button
            onClick={() => setIsFloatingBubbleMinimized(false)}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-expand-floating-ai"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>
        ) : (
          // Expanded oval prompt - flexible layout with text wrapping
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-0.5 rounded-3xl shadow-lg backdrop-blur-sm">
            <div className="bg-background rounded-3xl p-1 flex flex-col gap-0 min-w-[340px] max-w-[520px]">
              {/* Top row: Minimize button, input field, and send button */}
              <div className="flex items-center gap-0">
                {/* Minimize Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsFloatingBubbleMinimized(true)}
                        size="sm"
                        variant="ghost"
                        className="rounded-full w-6 h-6 p-0 hover:bg-muted flex-shrink-0"
                        data-testid="button-minimize-floating-ai"
                      >
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Minimize</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Input Field - wrapped in flex-1 div to allow proper text wrapping */}
                <div className="flex-1 min-w-[180px]">
                  <textarea
                    ref={floatingInputRef as any}
                    placeholder={selectedFloatingAgent === 'unified' ? "Ask anything..." : `Ask ${activeAgents.find(a => a.id === selectedFloatingAgent)?.displayName || 'agent'}...`}
                    value={floatingPrompt}
                    onChange={(e) => setFloatingPrompt(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFloatingSend();
                      }
                    }}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus:outline-none text-sm placeholder:text-muted-foreground w-full resize-none overflow-hidden pl-1"
                    disabled={isFloatingSending}
                    rows={1}
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>

                {/* Attachment Pills */}
                {floatingAttachments.length > 0 && (
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {floatingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs max-w-[100px]"
                      >
                        <span className="truncate">{attachment.name}</span>
                        <Button
                          onClick={() => removeFloatingAttachment(attachment.id)}
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleFloatingSend}
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-7 h-7 p-0 hover:bg-muted flex-shrink-0"
                  disabled={!floatingPrompt.trim() || isFloatingSending}
                >
                  {isFloatingSending ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {/* Bottom row: Agent selector, file attachment, and voice recording */}
              <div className="flex items-center gap-1 pl-3">
                {/* Agent Selector Dropdown */}
                <Select value={selectedFloatingAgent} onValueChange={setSelectedFloatingAgent}>
                  <SelectTrigger className="w-auto h-5 border-0 bg-transparent text-xs hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 px-1 gap-0.5">
                    <SelectValue>
                      {selectedFloatingAgent === 'unified' ? (
                        <div className="flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          <span className="text-xs">All Agents</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {(() => {
                            const IconComponent = getAgentIcon(selectedFloatingAgent);
                            return <IconComponent className="w-2.5 h-2.5" />;
                          })()}
                          <span className="text-xs">{activeAgents.find(a => a.id === selectedFloatingAgent)?.displayName || 'Agent'}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="unified" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>All Agents</span>
                      </div>
                    </SelectItem>
                    {activeAgents.map((agent) => {
                      const IconComponent = getAgentIcon(agent.id);
                      return (
                        <SelectItem key={agent.id} value={agent.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-3 h-3" />
                            <span>{agent.displayName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* File attachment input (hidden) */}
                <input
                  ref={floatingFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFloatingFilesSelected}
                  accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.sql,.log,image/*"
                />

                {/* Clipboard/File Attachment Button - smaller */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleFloatingFileUpload}
                        size="sm"
                        variant="ghost"
                        className="rounded-full w-4 h-4 p-0 hover:bg-muted flex-shrink-0"
                        disabled={isFloatingProcessingFiles || isFloatingSending}
                      >
                        {isFloatingProcessingFiles ? (
                          <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Paperclip className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Attach files</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Voice Recording Button - smaller */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={isFloatingRecording ? stopFloatingListening : startFloatingListening}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "rounded-full w-4 h-4 p-0 hover:bg-muted flex-shrink-0",
                          isFloatingRecording && "bg-red-500 hover:bg-red-600 text-white",
                          isFloatingTranscribing && "opacity-50"
                        )}
                        disabled={isFloatingTranscribing || isFloatingSending}
                      >
                        {isFloatingTranscribing ? (
                          <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isFloatingRecording ? (
                          <div className="flex items-center">
                            <StopCircle className="w-2 h-2" />
                            {floatingRecordingTimeLeft > 0 && (
                              <span className="ml-1 text-xs">{floatingRecordingTimeLeft}s</span>
                            )}
                          </div>
                        ) : (
                          <Mic className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{isFloatingRecording ? `Recording... ${floatingRecordingTimeLeft}s left` : isFloatingTranscribing ? 'Transcribing...' : 'Voice message'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
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