import { useState } from 'react';
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
import { Minimize, Send, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
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
  const [location] = useLocation();
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [isFloatingSending, setIsFloatingSending] = useState(false);

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
      
      // Add assistant response
      if (data?.content || data?.message) {
        addMessage({
          role: 'assistant',
          content: data.content || data.message,
          source: 'floating'
        });
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
      
      {/* Floating Max AI Prompt - always visible, positioned at bottom center */}
      {!isFullScreen && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-0.5 rounded-full shadow-lg backdrop-blur-sm">
            <div className="bg-background rounded-full p-2 flex items-center gap-2 min-w-[280px] max-w-[400px]">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <Input
                placeholder="Ask Max AI anything..."
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
      )}
    </div>
  );
}