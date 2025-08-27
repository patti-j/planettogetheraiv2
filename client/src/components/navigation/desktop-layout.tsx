import { useState, useEffect } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { BottomDrawer } from './bottom-drawer';
import { LeftRailNav } from './left-rail-nav';
import TopMenu from '@/components/top-menu';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Minimize, Send, Sparkles, Menu } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import { useLocation } from 'wouter';

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
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [isFloatingSending, setIsFloatingSending] = useState(false);

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
        setLocation(data.action.target);
        
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

      {/* Exit Fullscreen Button - only visible in fullscreen mode */}
      {isFullScreen && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleFullScreen}
                size="sm"
                variant="outline"
                className="fixed top-4 right-4 z-50 rounded-full w-10 h-10 p-0 bg-background/80 backdrop-blur-sm shadow-lg border-border/50"
              >
                <Minimize className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exit Fullscreen (ESC)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}