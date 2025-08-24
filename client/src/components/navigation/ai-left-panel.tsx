import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Activity, ChevronLeft, ChevronRight, Play, RefreshCw, MessageSquare, Send, User, Bot, GripVertical, Settings, Volume2, Palette, Zap, Shield, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AIInsight {
  id: string;
  type: 'insight' | 'anomaly' | 'recommendation' | 'simulation' | 'optimization' | 'bottleneck' | 'conflict';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  actionable: boolean;
  impact?: string;
  recommendation?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AILeftPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('ai-panel-width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Helper function to get gradient class based on theme
  const getThemeGradient = (theme: string) => {
    const gradients: Record<string, string> = {
      'purple-pink': 'bg-gradient-to-r from-purple-500 to-pink-600',
      'blue-indigo': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      'emerald-teal': 'bg-gradient-to-r from-emerald-500 to-teal-600',
      'orange-red': 'bg-gradient-to-r from-orange-500 to-red-600',
      'violet-purple': 'bg-gradient-to-r from-violet-500 to-purple-600',
      'cyan-blue': 'bg-gradient-to-r from-cyan-500 to-blue-600'
    };
    return gradients[theme] || gradients['purple-pink'];
  };
  
  // Fetch user preferences from database
  const { data: userPreferences } = useQuery<any>({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // AI Settings State - Load from localStorage and merge with user preferences
  const [aiSettings, setAiSettings] = useState(() => {
    const saved = localStorage.getItem('ai-settings');
    let settings = {
      model: 'gpt-4',
      responseStyle: 'professional',
      autoSuggestions: true,
      showInsights: true,
      notificationsEnabled: true,
      soundEnabled: false,
      contextWindow: 'standard',
      temperature: 0.7,
      maxTokens: 2000,
      streamResponses: true,
      // Voice Settings
      voice: 'alloy',
      voiceSpeed: 1.0,
      voiceGender: 'neutral',
      // Theme Settings
      aiThemeColor: 'purple-pink'
    };
    
    if (saved) {
      try {
        settings = { ...settings, ...JSON.parse(saved) };
      } catch (e) {
        // Fall back to defaults if parse fails
      }
    }
    
    return settings;
  });
  
  // Update settings when user preferences are loaded
  useEffect(() => {
    if (userPreferences?.aiThemeColor) {
      setAiSettings(prev => ({
        ...prev,
        aiThemeColor: userPreferences.aiThemeColor
      }));
    }
  }, [userPreferences]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [showMaxThinking, setShowMaxThinking] = useState(false);
  const [currentRequestController, setCurrentRequestController] = useState<AbortController | null>(null);
  
  // Get current page location
  const [location] = useState(() => window.location.pathname);
  
  // Fetch production status from Max AI
  const { data: productionStatus } = useQuery({
    queryKey: [`/api/max-ai/production-status?page=${location}`],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: activeTab === 'insights'
  });
  
  // Fetch proactive insights from Max AI
  const { data: maxInsights } = useQuery({
    queryKey: [`/api/max-ai/insights?page=${location}`],
    refetchInterval: 60000, // Refresh every minute
    enabled: activeTab === 'insights' || activeTab === 'anomalies'
  });
  
  // Cancel current Max request
  const cancelMaxRequest = () => {
    if (currentRequestController) {
      currentRequestController.abort();
      setCurrentRequestController(null);
      setShowMaxThinking(false);
      
      // Add cancellation message to chat
      const cancelMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Request cancelled.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, cancelMessage]);
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Create new AbortController for this request
      const controller = new AbortController();
      setCurrentRequestController(controller);
      setShowMaxThinking(true);
      
      // Check for navigation intents in the message
      const lowerMessage = message.toLowerCase();
      const navigationPatterns = [
        { patterns: ['show production schedule', 'show schedule', 'production schedule', 'view schedule', 'open schedule', 'go to schedule'], path: '/production-schedule' },
        { patterns: ['show analytics', 'view analytics', 'open analytics', 'go to analytics'], path: '/analytics' },
        { patterns: ['show shop floor', 'view shop floor', 'open shop floor', 'go to shop floor'], path: '/shop-floor' },
        { patterns: ['show inventory', 'view inventory', 'open inventory', 'go to inventory'], path: '/inventory-optimization' },
        { patterns: ['show capacity', 'view capacity', 'capacity planning', 'open capacity', 'go to capacity'], path: '/capacity-planning' },
        { patterns: ['show kpi', 'view kpi', 'show kpis', 'view kpis', 'open kpi', 'go to kpi'], path: '/smart-kpi-tracking' },
        { patterns: ['show reports', 'view reports', 'open reports', 'go to reports'], path: '/reports' },
        { patterns: ['show quality', 'view quality', 'quality control', 'open quality', 'go to quality'], path: '/quality-control' },
        { patterns: ['show dashboard', 'view dashboard', 'go home', 'go to home', 'open dashboard'], path: '/' },
        { patterns: ['show optimization', 'view optimization', 'optimization studio', 'go to optimization'], path: '/optimization-studio' },
        { patterns: ['show business goals', 'view goals', 'business goals', 'go to goals'], path: '/business-goals' },
        { patterns: ['show systems', 'view systems', 'systems management', 'go to systems'], path: '/systems-management-dashboard' },
        { patterns: ['show users', 'view users', 'user management', 'go to users'], path: '/user-access-management' },
        { patterns: ['show demand', 'view demand', 'demand planning', 'go to demand'], path: '/demand-planning' },
      ];
      
      // Check if message matches any navigation pattern
      let shouldNavigate = false;
      let navigationPath = '';
      
      for (const { patterns, path } of navigationPatterns) {
        if (patterns.some(pattern => lowerMessage.includes(pattern))) {
          shouldNavigate = true;
          navigationPath = path;
          break;
        }
      }
      
      // Navigate if a navigation intent was detected
      if (shouldNavigate) {
        setLocation(navigationPath);
        // Return a simple response indicating navigation
        return { 
          content: `Navigating to ${navigationPath === '/' ? 'dashboard' : navigationPath.slice(1).replace(/-/g, ' ')}...`,
          navigated: true,
          path: navigationPath
        };
      }
      
      // Otherwise, send to backend for AI processing
      const response = await fetch('/api/max-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          context: {
            currentPage: location,
            selectedData: null,
            recentActions: []
          }
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from Max AI');
      }
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      setShowMaxThinking(false);
      setCurrentRequestController(null);
      console.log("Max AI Full Response:", data);
      
      // Handle navigation actions from Max AI
      if (data?.action?.type === 'navigate' && data?.action?.target) {
        setLocation(data.action.target);
        
        // Show navigation confirmation
        const navigationResponse: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content || `Navigating to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, navigationResponse]);
        return;
      }
      
      // Store response for display
      if (data?.content || data?.message) {
        const responseContent = data.content || data.message;
        
        const aiResponse: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }
      
      // If there are insights, show them (but not if we just navigated)
      if (data?.insights && data.insights.length > 0 && !data?.navigated) {
        // Switch to insights tab to show them
        setActiveTab('insights');
      }
    },
    onError: (error: any) => {
      setShowMaxThinking(false);
      setCurrentRequestController(null);
      console.error("Max AI Error:", error);
      
      // Don't show error message if request was aborted (cancelled)
      if (error.name === 'AbortError') {
        return;
      }
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
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
        <span
          key={`link-${index}`}
          onClick={() => {
            const userMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'user',
              content: replacement.query,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages(prev => [...prev, userMessage]);
            sendMessageMutation.mutate(replacement.query);
            setPrompt('');
          }}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline font-medium transition-colors cursor-pointer"
          title={`Click to: ${replacement.query}`}
        >
          {replacement.text}
        </span>
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Listen for toggle event from command palette
  useEffect(() => {
    const handleToggle = () => setIsCollapsed(prev => !prev);
    document.addEventListener('toggle-ai-panel', handleToggle);
    return () => document.removeEventListener('toggle-ai-panel', handleToggle);
  }, []);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, 280), 600);
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('ai-panel-width', panelWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, panelWidth]);

  // Transform Max AI insights to display format
  const displayInsights: AIInsight[] = (Array.isArray(maxInsights) ? maxInsights : []).map((insight: any, index: number) => ({
    id: insight.id || `insight-${index}`,
    type: insight.type || 'insight',
    title: insight.title,
    description: insight.description,
    priority: insight.severity || 'medium',
    timestamp: 'Now',
    actionable: insight.actionable || false,
    impact: insight.data?.impact,
    recommendation: insight.recommendation
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return AlertTriangle;
      case 'insight': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'simulation': return Activity;
      default: return Brain;
    }
  };

  const handleSendMessage = () => {
    if (!prompt.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMessage]);
    setPrompt('');

    // Send message to Max AI
    sendMessageMutation.mutate(prompt);
  };

  return (
    <div 
      ref={panelRef}
      className={cn(
        "h-full bg-background border-l flex flex-col relative",
        isCollapsed && "transition-all duration-300"
      )}
      style={{
        width: isCollapsed ? '56px' : `${panelWidth}px`,
        transition: isCollapsed ? 'width 300ms' : undefined
      }}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors",
            "flex items-center justify-center group",
            isResizing && "bg-primary/30"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 left-0 w-4 -translate-x-1/2" />
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      
      {/* Header */}
      <div className={cn("p-4 border-b flex items-center justify-between text-white", getThemeGradient(aiSettings.aiThemeColor))}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-white" />
            <span className="font-semibold">Max AI Assistant</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("text-white hover:bg-white/20", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* AI Status */}
          <div className="p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">AI Active</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Analyzing production data in real-time
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-5 mx-4 mt-2 text-xs">
              <TabsTrigger value="chat" className="px-2">Chat</TabsTrigger>
              <TabsTrigger value="insights" className="px-2">Insights</TabsTrigger>
              <TabsTrigger value="anomalies" className="px-2">Alerts</TabsTrigger>
              <TabsTrigger value="simulations" className="px-2">Sims</TabsTrigger>
              <TabsTrigger value="settings" className="px-2">Settings</TabsTrigger>
            </TabsList>

            {/* Chat Tab with its own layout */}
            <TabsContent value="chat" className="flex-1 flex flex-col px-4 mt-2 overflow-hidden data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-4 pb-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' && "flex-row-reverse"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[85%]",
                          message.role === 'user' && "items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {message.role === 'assistant' 
                            ? renderContentWithClickableKeywords(message.content)
                            : message.content
                          }
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                </div>
              </ScrollArea>
              
              {/* Chat Input */}
              <div className="border-t pt-4 pb-2">
                {/* Thinking indicator in input area */}
                {showMaxThinking && (
                  <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Max is thinking...</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelMaxRequest}
                        className="h-6 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask Max anything..."
                    className="flex-1"
                    disabled={showMaxThinking}
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={showMaxThinking}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 mb-1">
                  Max can help with scheduling, optimization, and insights
                </p>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="flex-1 overflow-hidden mt-2 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-3 pt-2 pb-4">
                {displayInsights
                  .filter(i => i.type === 'insight' || i.type === 'recommendation' || i.type === 'optimization')
                  .map(insight => (
                    <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = getTypeIcon(insight.type);
                              return <Icon className="w-4 h-4 text-primary" />;
                            })()}
                            <CardTitle className="text-sm">{insight.title}</CardTitle>
                          </div>
                          <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                            {insight.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.impact && (
                          <div className="text-xs bg-muted p-2 rounded mb-2">
                            <span className="font-medium">Impact: </span>
                            {insight.impact}
                          </div>
                        )}
                        {insight.actionable && (
                          <Button size="sm" className="w-full">
                            <Play className="w-3 h-3 mr-1" />
                            Apply Recommendation
                          </Button>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">{insight.timestamp}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="anomalies" className="flex-1 overflow-hidden mt-2 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-3 pt-2 pb-4">
                {displayInsights
                  .filter(i => i.type === 'anomaly' || i.type === 'bottleneck' || i.type === 'conflict')
                  .map(insight => (
                    <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors border-orange-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <CardTitle className="text-sm">{insight.title}</CardTitle>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Anomaly
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.impact && (
                          <div className="text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded mb-2">
                            <span className="font-medium">Impact: </span>
                            {insight.impact}
                          </div>
                        )}
                        {insight.recommendation && (
                          <div className="text-xs bg-muted p-2 rounded mb-2">
                            <span className="font-medium">Recommendation: </span>
                            {insight.recommendation}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Investigate
                          </Button>
                          <Button size="sm" className="flex-1">
                            Fix Now
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">{insight.timestamp}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Simulations Tab */}
            <TabsContent value="simulations" className="flex-1 overflow-hidden mt-2 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-3 pt-2 pb-4">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Quick Simulation
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Run what-if scenarios instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Activity className="w-3 h-3 mr-2" />
                        Add Rush Order Impact
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Activity className="w-3 h-3 mr-2" />
                        Machine Downtime Scenario
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Activity className="w-3 h-3 mr-2" />
                        Resource Reallocation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {displayInsights
                  .filter(i => i.type === 'simulation')
                  .map(insight => (
                    <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <CardTitle className="text-sm">{insight.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.impact && (
                          <div className="text-xs bg-muted p-2 rounded mb-2">
                            {insight.impact}
                          </div>
                        )}
                        <Button size="sm" variant="outline" className="w-full">
                          View Results
                        </Button>
                        <div className="text-xs text-muted-foreground mt-2">{insight.timestamp}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="flex-1 overflow-hidden mt-2 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-6 pt-2 pb-4">
                  {/* Model Settings */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Model
                      </h3>
                      <Select value={aiSettings.model} onValueChange={(value) => setAiSettings(prev => ({ ...prev, model: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Most Capable)</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Faster)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Economy)</SelectItem>
                          <SelectItem value="claude-3">Claude 3 (Alternative)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Response Style
                      </h3>
                      <Select value={aiSettings.responseStyle} onValueChange={(value) => setAiSettings(prev => ({ ...prev, responseStyle: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Feature Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      AI Features
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-suggestions" className="text-sm cursor-pointer">
                        Auto-suggestions
                      </Label>
                      <Switch
                        id="auto-suggestions"
                        checked={aiSettings.autoSuggestions}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, autoSuggestions: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-insights" className="text-sm cursor-pointer">
                        Show insights
                      </Label>
                      <Switch
                        id="show-insights"
                        checked={aiSettings.showInsights}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, showInsights: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="stream-responses" className="text-sm cursor-pointer">
                        Stream responses
                      </Label>
                      <Switch
                        id="stream-responses"
                        checked={aiSettings.streamResponses}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, streamResponses: checked }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Voice Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Voice Settings
                    </h3>
                    
                    <div>
                      <Label htmlFor="voice" className="text-sm">Voice</Label>
                      <Select value={aiSettings.voice} onValueChange={(value) => setAiSettings(prev => ({ ...prev, voice: value }))}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                          <SelectItem value="echo">Echo (Male)</SelectItem>
                          <SelectItem value="fable">Fable (British)</SelectItem>
                          <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                          <SelectItem value="nova">Nova (Female)</SelectItem>
                          <SelectItem value="shimmer">Shimmer (Soft Female)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="voice-speed" className="text-sm">
                        Voice Speed: {aiSettings.voiceSpeed}x
                      </Label>
                      <Slider
                        id="voice-speed"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[aiSettings.voiceSpeed]}
                        onValueChange={([value]) => setAiSettings(prev => ({ ...prev, voiceSpeed: value }))}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Adjust the speed of voice responses
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Theme Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      AI Theme Color
                    </h3>
                    
                    <Select value={aiSettings.aiThemeColor} onValueChange={(value) => setAiSettings(prev => ({ ...prev, aiThemeColor: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purple-pink">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600" />
                            Purple Pink
                          </div>
                        </SelectItem>
                        <SelectItem value="blue-indigo">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                            Blue Indigo
                          </div>
                        </SelectItem>
                        <SelectItem value="emerald-teal">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
                            Emerald Teal
                          </div>
                        </SelectItem>
                        <SelectItem value="orange-red">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600" />
                            Orange Red
                          </div>
                        </SelectItem>
                        <SelectItem value="violet-purple">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-600" />
                            Violet Purple
                          </div>
                        </SelectItem>
                        <SelectItem value="cyan-blue">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                            Cyan Blue
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifications
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications" className="text-sm cursor-pointer">
                        AI notifications
                      </Label>
                      <Switch
                        id="notifications"
                        checked={aiSettings.notificationsEnabled}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound" className="text-sm cursor-pointer">
                        Sound alerts
                      </Label>
                      <Switch
                        id="sound"
                        checked={aiSettings.soundEnabled}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, soundEnabled: checked }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Advanced
                    </h3>

                    <div>
                      <Label htmlFor="temperature" className="text-sm">
                        Creativity (Temperature): {aiSettings.temperature}
                      </Label>
                      <Slider
                        id="temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[aiSettings.temperature]}
                        onValueChange={([value]) => setAiSettings(prev => ({ ...prev, temperature: value }))}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower = More focused, Higher = More creative
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="max-tokens" className="text-sm">
                        Response Length: {aiSettings.maxTokens} tokens
                      </Label>
                      <Slider
                        id="max-tokens"
                        min={500}
                        max={4000}
                        step={500}
                        value={[aiSettings.maxTokens]}
                        onValueChange={([value]) => setAiSettings(prev => ({ ...prev, maxTokens: value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="context-window" className="text-sm">
                        Context Window
                      </Label>
                      <Select value={aiSettings.contextWindow} onValueChange={(value) => setAiSettings(prev => ({ ...prev, contextWindow: value }))}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal (Last 5 messages)</SelectItem>
                          <SelectItem value="standard">Standard (Last 10 messages)</SelectItem>
                          <SelectItem value="extended">Extended (Last 20 messages)</SelectItem>
                          <SelectItem value="maximum">Maximum (Full conversation)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Save Button */}
                  <Button 
                    className="w-full"
                    onClick={async () => {
                      // Save settings to localStorage
                      localStorage.setItem('ai-settings', JSON.stringify(aiSettings));
                      
                      // Save AI theme color to backend
                      if (user?.id) {
                        try {
                          await apiRequest('PATCH', `/api/user-preferences/${user.id}`, {
                            aiThemeColor: aiSettings.aiThemeColor
                          });
                          
                          // Invalidate query to refresh preferences
                          queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user.id}`] });
                          
                          // Show success feedback (you could add a toast here)
                          console.log('Settings saved successfully');
                        } catch (error) {
                          console.error('Failed to save settings:', error);
                        }
                      }
                    }}
                  >
                    Save Settings
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Collapsed state - show icon indicators */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('chat');
            }}
            title="Open AI Chat"
          >
            <Brain className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </Button>
          <Separator className="w-6" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('insights');
            }}
            title="View AI Insights (3 new)"
          >
            <TrendingUp className="w-5 h-5" />
            <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              3
            </Badge>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('anomalies');
            }}
            title="View Anomalies (1 critical)"
          >
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              1
            </Badge>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('simulations');
            }}
            title="Run AI Simulations"
          >
            <Activity className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}