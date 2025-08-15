import { ReactNode, useState, useEffect, useRef } from "react";
import TopMenu from "@/components/top-menu";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Mic, MicOff, X, Calendar, BookOpen, Settings, LogOut } from "lucide-react";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { navigationGroups } from "@/config/navigation-menu";
import { useAuth, usePermissions } from "@/hooks/useAuth";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [maxCommand, setMaxCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentDialogOpen, setRecentDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setMaxOpen, setCanvasVisible, addMessage } = useMaxDock();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const recognitionRef = useRef<any>(null);
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Fetch user preferences for voice settings
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user-preferences/' + localStorage.getItem('userId')],
    enabled: !!localStorage.getItem('userId')
  });

  const isVoiceEnabled = (userPreferences as any)?.maxAiState?.voiceEnabled || false;

  // Filter navigation groups based on search query and permissions (matching desktop menu)
  const filteredNavigationGroups = navigationGroups.map((group) => ({
    ...group,
    features: group.features.filter((feature) => {
      // Skip permission check for common menu items that should always be visible
      const alwaysVisibleItems = ['Smart KPI Tracking', 'Max AI Assistant', 'Getting Started', 'Take a Guided Tour'];
      
      // Check permissions only if not in always visible list
      if (!alwaysVisibleItems.includes(feature.label)) {
        if (feature.feature && feature.action && !hasPermission(feature.feature, feature.action)) {
          return false;
        }
      }
      
      // Apply search filter if search term exists
      if (searchQuery) {
        return feature.label.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    }),
  })).filter((group) => group.features.length > 0);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", "/api/max-ai/chat", { 
        message,
        context: {
          currentPage: location,
          selectedData: null,
          recentActions: []
        }
      });
    },
    onSuccess: (data: any) => {
      console.log("Max AI Response:", data);
      
      // Add message to Max panel - new Max AI service returns 'content' instead of 'message'
      if (data?.content) {
        addMessage({
          id: Date.now().toString(),
          content: data.content,
          role: 'assistant',
          timestamp: new Date()
        });
        
        // Show toast notification with Max's response on mobile
        toast({
          title: "Max AI",
          description: data.content,
          duration: 5000,
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

      // Show suggestions if available
      if (data?.suggestions && data.suggestions.length > 0) {
        const suggestionText = "Suggestions: " + data.suggestions.join(", ");
        toast({
          title: "Max AI Suggestions",
          description: suggestionText,
          duration: 5000,
        });
      }

      // Show canvas for visual content or if there's data to display
      if (data?.canvasAction || data?.actions?.includes('ADD_CANVAS_CONTENT') || data?.data) {
        setCanvasVisible(true);
        setMaxOpen(true);
      } else if (data?.content) {
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
    if (!isVoiceEnabled || !(window as any).webkitSpeechRecognition) return;

    const recognition = new (window as any).webkitSpeechRecognition();
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
            {/* Max Settings Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMaxOpen(true)}
              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Max Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area - with padding for fixed header and footer */}
      <div className="pt-16 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900 relative z-0">
        {children}
      </div>
      
      {/* Mobile footer bar - always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-[999999]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', minHeight: '65px', zIndex: 999999 }}>
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
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="flex flex-col items-center gap-1 p-2 h-auto text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px]">Menu</span>
          </button>
          
          {/* Recent Button */}
          <button
            onClick={() => {
              setRecentDialogOpen(!recentDialogOpen);
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
              setProfileDialogOpen(!profileDialogOpen);
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

      {/* Mobile Menu Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bottom-16 z-[99999] lg:hidden" style={{ zIndex: 99999 }}>
          {/* Overlay - adjusted to not cover footer */}
          <div 
            className="fixed inset-0 bottom-16 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar Panel - adjusted height to not overlap footer */}
          <div className="fixed left-0 top-0 bottom-16 w-72 bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out" style={{ zIndex: 100000 }}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>{(user?.firstName || user?.username)?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user?.firstName || user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'demo@example.com'}</p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Search bar */}
              <div className="p-4 border-b dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              
              {/* Navigation Menu */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {filteredNavigationGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <div
                            key={feature.href}
                            className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setSearchQuery("");
                              setLocation(feature.href);
                            }}
                          >
                            <Icon className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{feature.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Pages Dialog */}
      {recentDialogOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center" style={{ zIndex: 99999 }}>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setRecentDialogOpen(false)}
          />
          {/* Dialog Panel */}
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl p-6 w-full max-w-md pb-safe-area animate-slide-up" style={{ zIndex: 100000 }}>
            <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Pages</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecentDialogOpen(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl justify-start border border-gray-200 dark:border-gray-600"
                onClick={() => {
                  setLocation('/production-schedule');
                  setRecentDialogOpen(false);
                }}
              >
                <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Production Schedule</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl justify-start border border-gray-200 dark:border-gray-600"
                onClick={() => {
                  setLocation('/onboarding');
                  setRecentDialogOpen(false);
                }}
              >
                <BookOpen className="w-5 h-5 mr-3 text-green-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Getting Started</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Dialog */}
      {profileDialogOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center" style={{ zIndex: 99999 }}>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setProfileDialogOpen(false)}
          />
          {/* Dialog Panel */}
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl p-6 w-full max-w-md pb-safe-area animate-slide-up" style={{ zIndex: 100000 }}>
            <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileDialogOpen(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl justify-start border border-gray-200 dark:border-gray-600"
                onClick={() => {
                  setLocation('/account');
                  setProfileDialogOpen(false);
                }}
              >
                <Settings className="w-5 h-5 mr-3 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Account Settings</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl justify-start border border-gray-200 dark:border-gray-600"
                onClick={() => {
                  setLocation('/settings');
                  setProfileDialogOpen(false);
                }}
              >
                <Settings className="w-5 h-5 mr-3 text-gray-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Preferences</span>
              </Button>
              <Button
                variant="destructive"
                className="w-full text-left p-4 rounded-xl justify-start bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  logout();
                  setProfileDialogOpen(false);
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-semibold">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}