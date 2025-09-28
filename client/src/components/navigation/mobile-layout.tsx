import { ReactNode, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Mic, MicOff, X, Calendar, BookOpen, Settings, LogOut, Clock, Trash2, Menu, Home } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigation } from "@/contexts/NavigationContext";
import * as LucideIcons from "lucide-react";

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
  const [maxResponse, setMaxResponse] = useState<{content: string, suggestions?: string[]} | null>(null);
  const [showMaxResponse, setShowMaxResponse] = useState(false);
  const [showMaxThinking, setShowMaxThinking] = useState(false);
  const [showMaxSettings, setShowMaxSettings] = useState(false);
  const { setMaxOpen, setCanvasVisible, addMessage } = useMaxDock();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const recognitionRef = useRef<any>(null);
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  // Safe navigation context access with fallback
  let recentPages = [];
  let clearRecentPages = () => {};
  try {
    const navigation = useNavigation();
    recentPages = navigation.recentPages || [];
    clearRecentPages = navigation.clearRecentPages;
  } catch (error) {
    console.warn('NavigationContext not available in MobileLayout, using fallback:', error);
  }
  
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
      const alwaysVisibleItems = ['SMART KPI Tracking', 'Max', 'Getting Started', 'Take a Guided Tour'];
      
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
      setShowMaxThinking(true);
      setShowMaxResponse(false);
      const response = await apiRequest("POST", "/api/max-ai/chat", { 
        message,
        context: {
          currentPage: location,
          selectedData: null,
          recentActions: []
        }
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setShowMaxThinking(false);
      console.log("Max AI Full Response:", data);
      
      // Handle navigation actions from Max AI
      if (data?.action?.type === 'navigate' && data?.action?.target) {
        setLocation(data.action.target);
        
        // Show navigation confirmation in mobile
        setMaxResponse({
          content: data.content || `Taking you to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          suggestions: []
        });
        setShowMaxResponse(true);
        
        // Also add to Max panel
        addMessage({
          id: Date.now().toString(),
          content: data.content || `Navigating to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          role: 'assistant',
          timestamp: new Date()
        });
        return;
      }

      // Handle chart creation actions from Max AI
      if (data?.action?.type === 'create_chart' && data?.action?.chartConfig) {
        console.log('Mobile Layout - Handling create_chart action:', data.action);
        
        // Show chart creation response in mobile
        setMaxResponse({
          content: `📊 Chart created: ${data.action.chartConfig.title || 'Data Visualization'}`,
          suggestions: ["Show me another chart", "Navigate to dashboard", "What insights do you see?"],
          chartData: data.action.chartConfig
        });
        setShowMaxResponse(true);
        
        // Also add to Max panel with chart info
        addMessage({
          id: Date.now().toString(),
          content: `📊 Created ${data.action.chartConfig.type} chart: ${data.action.chartConfig.title || 'Data Visualization'}`,
          role: 'assistant',
          timestamp: new Date(),
          chartData: data.action.chartConfig
        });
        return;
      }
      
      // Store response for display
      if (data?.content || data?.message) {
        const responseContent = data.content || data.message;
        
        setMaxResponse({
          content: responseContent,
          suggestions: data.suggestions
        });
        setShowMaxResponse(true);
        
        // Also add to Max panel
        addMessage({
          id: Date.now().toString(),
          content: responseContent,
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

      // Suggestions are now shown in the purple banner, no need for toast

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
      setShowMaxThinking(false);
      console.error("Max AI Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message to Max. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Function to render content with clickable keywords
  const renderContentWithClickableKeywords = (content: string) => {
    // Define important patterns to make clickable - now much more comprehensive
    const importantPatterns = [
      // Specific alerts and issues
      { pattern: /Resource Overutilization Alert/gi, query: 'Tell me more about the resource overutilization issue' },
      { pattern: /Material Shortage Alert/gi, query: 'Analyze the material shortage situation in detail' },
      { pattern: /Quality Deviation Alert/gi, query: 'Explain the quality deviation issue and how to fix it' },
      { pattern: /CNC Milling Machine/gi, query: 'Show me detailed status of the CNC Milling Machine' },
      { pattern: /Aluminum Sheets/gi, query: 'Check inventory levels for Aluminum Sheets' },
      { pattern: /defect rate/gi, query: 'Analyze defect rates and quality trends' },
      { pattern: /120% capacity/gi, query: 'Explain the capacity overload situation' },
      { pattern: /8%/gi, query: 'Analyze the 8% metric in detail' },
      
      // Generic important terms
      { pattern: /potential breakdowns/gi, query: 'How can we prevent potential breakdowns?' },
      { pattern: /quality issues/gi, query: 'Show me all quality issues and recommendations' },
      { pattern: /running low/gi, query: 'What items are running low and need replenishment?' },
      { pattern: /delay/gi, query: 'Analyze potential delays and their impact' },
      { pattern: /significant deviation/gi, query: 'Explain the deviation and corrective actions' },
      { pattern: /above the acceptable threshold/gi, query: 'What are the current thresholds and violations?' },
      
      // Resource and capacity terms
      { pattern: /equipment usage/gi, query: 'Show me detailed equipment usage analytics' },
      { pattern: /labor allocation/gi, query: 'Analyze current labor allocation and efficiency' },
      { pattern: /material consumption/gi, query: 'Review material consumption patterns and waste' },
      { pattern: /equipment scheduling/gi, query: 'Check equipment scheduling conflicts' },
      { pattern :/workforce scheduling/gi, query: 'Analyze workforce scheduling' },
      { pattern: /material availability/gi, query: 'Review material availability status' },
      
      // Metrics and analytics
      { pattern: /utilization metrics/gi, query: 'Show detailed utilization metrics analysis' },
      { pattern: /completion metrics/gi, query: 'Analyze completion metrics and trends' },
      { pattern: /data capture systems/gi, query: 'Check data capture system status' },
      { pattern: /system downtime/gi, query: 'Analyze system downtime and causes' },
      { pattern: /maintenance activities/gi, query: 'Review maintenance activities and schedule' },
      
      // Actions and recommendations
      { pattern: /addressing any of these/gi, query: 'Yes, help me address these issues' },
      { pattern: /assistance/gi, query: 'Yes, I need assistance with this' },
      { pattern: /recommendations/gi, query: 'Show me all recommendations' }
    ];

    // Process the content
    let processedContent = content;
    const replacements: Array<{start: number, end: number, text: string, query: string}> = [];
    
    // Find all matches
    importantPatterns.forEach(({pattern, query}) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          query: query
        });
      }
    });
    
    // Sort replacements by position (reverse order for processing)
    replacements.sort((a, b) => b.start - a.start);
    
    // Remove overlapping replacements (keep the longer ones)
    const finalReplacements = replacements.filter((current, index) => {
      return !replacements.slice(0, index).some(other => 
        current.start >= other.start && current.end <= other.end
      );
    });
    
    // Build the result
    if (finalReplacements.length === 0) {
      return <span>{content}</span>;
    }
    
    // Sort back to normal order for rendering
    finalReplacements.sort((a, b) => a.start - b.start);
    
    const elements: JSX.Element[] = [];
    let lastEnd = 0;
    
    finalReplacements.forEach((replacement, index) => {
      // Add text before the match
      if (replacement.start > lastEnd) {
        elements.push(
          <span key={`text-${index}`}>{content.substring(lastEnd, replacement.start)}</span>
        );
      }
      
      // Add the clickable element
      elements.push(
        <button
          key={`link-${index}`}
          onClick={() => {
            addMessage({
              id: Date.now().toString(),
              content: replacement.query,
              role: 'user',
              timestamp: new Date()
            });
            sendMessageMutation.mutate(replacement.query);
          }}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline font-medium transition-colors cursor-pointer"
          title={`Click to: ${replacement.query}`}
        >
          {replacement.text}
        </button>
      );
      
      lastEnd = replacement.end;
    });
    
    // Add remaining text
    if (lastEnd < content.length) {
      elements.push(
        <span key="text-final">{content.substring(lastEnd)}</span>
      );
    }
    
    return <span>{elements}</span>;
  };

  // Prevent body scroll when mobile menu or dialogs are open
  useEffect(() => {
    if (mobileMenuOpen || recentDialogOpen || profileDialogOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to ensure overflow is reset
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, recentDialogOpen, profileDialogOpen]);

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
      {/* Mobile header - fixed at top with main navigation */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo size="small" showText={false} />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">PlanetTogether</h1>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {/* Home Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocation('/home')}
              className="h-9 w-9 p-0"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </Button>
            
            {/* Recent Pages */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRecentDialogOpen(true)}
              className="h-9 w-9 p-0"
              title="Recent Pages"
            >
              <Clock className="h-4 w-4" />
            </Button>
            
            {/* Main Menu Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9 p-0"
              title="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Profile */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setProfileDialogOpen(true)}
              className="h-9 w-9 p-0"
              title="Profile"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </div>
      
      
      {/* Main content area - with padding for fixed header and bottom Max interface */}
      <div className="pt-16 pb-24 min-h-screen bg-gray-50 dark:bg-gray-900 relative z-0">
        {children}
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
              <div className="flex-1 p-4 space-y-4 overflow-y-auto overscroll-contain">
                {filteredNavigationGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.features.map((feature, index) => {
                        const Icon = feature.icon;
                        // Use predefined colors from navigation config or fall back to a color palette
                        const colors = [
                          'text-blue-500',
                          'text-green-500', 
                          'text-purple-500',
                          'text-orange-500',
                          'text-red-500',
                          'text-cyan-500',
                          'text-pink-500',
                          'text-yellow-500',
                          'text-indigo-500',
                          'text-emerald-500',
                          'text-violet-500',
                          'text-rose-500'
                        ];
                        const iconColor = colors[index % colors.length];
                        
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
                            <Icon className={`w-4 h-4 mr-3 ${iconColor}`} />
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
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl w-full max-w-md pb-safe-area animate-slide-up flex flex-col max-h-[80vh]" style={{ zIndex: 100000 }}>
            <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-4"></div>
            <div className="flex items-center justify-between mb-5 px-6">
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
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
              <div className="space-y-2">
              {recentPages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No recent pages yet</p>
                  <p className="text-xs">Navigate to pages to see them here</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {recentPages.length} recent page{recentPages.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentPages}
                      className="text-xs text-gray-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  {recentPages.map((page, index) => {
                    // Get the icon component dynamically
                    const IconComponent = (LucideIcons as any)[page.icon] || LucideIcons.FileText;
                    const colors = [
                      'text-blue-500',
                      'text-green-500', 
                      'text-purple-500',
                      'text-orange-500',
                      'text-red-500',
                      'text-cyan-500',
                      'text-pink-500',
                      'text-yellow-500'
                    ];
                    
                    return (
                      <Button
                        key={`${page.path}-${page.timestamp}`}
                        variant="ghost"
                        className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl justify-start border border-gray-200 dark:border-gray-600"
                        onClick={() => {
                          setLocation(page.path);
                          setRecentDialogOpen(false);
                        }}
                      >
                        <IconComponent className={`w-5 h-5 mr-3 ${colors[index % colors.length]}`} />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            {page.label}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </>
              )}
              </div>
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

      {/* Max AI Settings Dialog */}
      {showMaxSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 lg:hidden" onClick={() => setShowMaxSettings(false)}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                Max AI Settings
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMaxSettings(false)}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* AI Theme Colors */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">AI Theme</label>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 transition-colors"></button>
                  <button className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-600 border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 transition-colors"></button>
                  <button className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 border-2 border-gray-300 dark:border-gray-600 hover:border-orange-500 transition-colors"></button>
                  <button className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors"></button>
                  <button className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 transition-colors"></button>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">Voice Settings</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Voice</span>
                  <input 
                    type="checkbox" 
                    defaultChecked={isVoiceEnabled}
                    className="rounded text-purple-600 focus:ring-purple-500" 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Voice Response</span>
                  <select className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>Alloy (Default)</option>
                    <option>Echo</option>
                    <option>Fable</option>
                    <option>Onyx</option>
                    <option>Nova</option>
                    <option>Shimmer</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Voice Speed</span>
                  <select className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>Normal</option>
                    <option>Slow</option>
                    <option>Fast</option>
                  </select>
                </div>
              </div>

              {/* Response Settings */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">Response Settings</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Response Style</span>
                  <select className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>Balanced</option>
                    <option>Quick & Concise</option>
                    <option>Detailed & Thorough</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Action Buttons</span>
                  <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-create Widgets</span>
                  <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Suggestions</span>
                  <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500" />
                </div>
              </div>

              {/* Save Button */}
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                onClick={() => {
                  toast({
                    title: "Settings Saved",
                    description: "Your Max AI preferences have been updated.",
                  });
                  setShowMaxSettings(false);
                }}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Max AI Interface - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Max AI Response Display - shows above input when there's a response */}
        {showMaxResponse && maxResponse && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {renderContentWithClickableKeywords(maxResponse.content)}
                  </div>
                </div>
                <button
                  onClick={() => setShowMaxResponse(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Max AI Thinking Indicator */}
        {showMaxThinking && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Max is thinking...</span>
                <div className="flex items-center gap-1 ml-auto">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Max Input Interface */}
        <div className="p-3">
          <div className="flex items-center gap-2">
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
                className="pl-12 pr-4 h-10 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                disabled={sendMessageMutation.isPending}
              />
            </div>
            {isVoiceEnabled && (
              <Button
                size="sm"
                variant={isListening ? "default" : "ghost"}
                onClick={toggleVoiceInput}
                className={`h-10 w-10 p-0 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                disabled={sendMessageMutation.isPending}
              >
                {isListening ? (
                  <Mic className="h-4 w-4 text-white animate-pulse" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMaxSettings(true)}
              className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Max AI Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}