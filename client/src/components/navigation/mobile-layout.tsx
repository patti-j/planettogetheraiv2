import { ReactNode, useState, useEffect, useRef } from "react";
import TopMenu from "@/components/top-menu";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Mic, MicOff } from "lucide-react";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [maxCommand, setMaxCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const { setMaxOpen, setCanvasVisible, addMessage } = useMaxDock();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const recognitionRef = useRef<any>(null);
  
  // Fetch user preferences for voice settings
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user-preferences/' + localStorage.getItem('userId')],
    enabled: !!localStorage.getItem('userId')
  });

  const isVoiceEnabled = userPreferences?.maxAiState?.voiceEnabled || false;

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", "/api/ai-agent/chat", { 
        message,
        currentPage: location 
      });
    },
    onSuccess: (data: any) => {
      console.log("Max AI Response:", data);
      
      // Add message to Max panel
      if (data?.message) {
        addMessage({
          id: Date.now().toString(),
          content: data.message,
          role: 'assistant',
          timestamp: new Date()
        });
      }

      // Handle navigation if action requires it
      if (data?.navigateTo) {
        setLocation(data.navigateTo);
      }

      // Handle specific actions
      if (data?.actions?.includes('NAVIGATE_TO_PAGE')) {
        const targetPage = data?.targetPage || data?.parameters?.page;
        if (targetPage) {
          setLocation(targetPage);
        }
      }

      // Show canvas for visual content
      if (data?.canvasAction || data?.actions?.includes('ADD_CANVAS_CONTENT')) {
        setCanvasVisible(true);
        setMaxOpen(true);
      } else if (data?.message) {
        // Only open Max panel if there's a message
        setMaxOpen(true);
      }

      // Handle voice response if enabled
      if (isVoiceEnabled && data?.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(err => console.error("Failed to play audio:", err));
      }
    },
    onError: (error: any) => {
      console.error("Max AI Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message to Max. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Voice input handling
  useEffect(() => {
    if (!isVoiceEnabled || !window.webkitSpeechRecognition) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMaxCommand(transcript);
      sendMessageMutation.mutate(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      toast({
        title: "Voice Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [isVoiceEnabled]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your command to Max"
      });
    }
  };

  const handleMaxCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && maxCommand.trim()) {
      // Add user message to Max panel
      addMessage({
        id: Date.now().toString(),
        content: maxCommand,
        role: 'user',
        timestamp: new Date()
      });
      
      sendMessageMutation.mutate(maxCommand);
      setMaxCommand("");
    }
  };

  return (
    <>
      {/* Mobile header - fixed at top */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Logo */}
          <Logo size="small" showText={false} />
          
          {/* Max Search/Command Input */}
          <div className="flex-1 relative flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Ask Max anything..."
                value={maxCommand}
                onChange={(e) => setMaxCommand(e.target.value)}
                onKeyDown={handleMaxCommand}
                className="pl-12 pr-4 h-9 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 mobile-header-search"
                disabled={sendMessageMutation.isPending}
              />
            </div>
            {isVoiceEnabled && (
              <Button
                size="sm"
                variant={isListening ? "default" : "ghost"}
                onClick={toggleVoiceInput}
                className={`h-9 w-9 p-0 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                disabled={sendMessageMutation.isPending}
              >
                {isListening ? (
                  <Mic className="h-4 w-4 text-white animate-pulse" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content area - with padding for fixed header and footer */}
      <div className="pt-16 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
      
      {/* Mobile footer bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', minHeight: '65px' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {/* Home Button */}
          <button
            onClick={() => {
              if (location !== '/mobile-home') {
                setLocation('/mobile-home');
              }
            }}
            className="flex flex-col items-center gap-1 p-2 h-auto text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px]">Home</span>
          </button>
          
          {/* Menu Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const event = new CustomEvent('toggleMenu');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center gap-1 p-2 h-auto text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px]">Menu</span>
          </button>
          
          {/* Search Button */}
          <button
            onClick={() => {
              const event = new CustomEvent('openSearch');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center gap-1 p-2 h-auto text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px]">Search</span>
          </button>
          
          {/* Recent Button */}
          <button
            onClick={() => {
              // Open recent pages menu or navigate to recent page
              const event = new CustomEvent('openRecent');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center gap-1 p-2 h-auto text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px]">Recent</span>
          </button>
          
          {/* Profile Button */}
          <button
            onClick={() => {
              const event = new CustomEvent('openProfile');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center gap-1 p-2 h-auto text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>
    </>
  );
}