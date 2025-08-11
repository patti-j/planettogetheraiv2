import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Activity, ChevronLeft, ChevronRight, Play, RefreshCw, MessageSquare, Send, User, Bot, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface AIInsight {
  id: string;
  type: 'insight' | 'anomaly' | 'recommendation' | 'simulation';
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
      timestamp: '10:00 AM'
    },
    {
      id: '2',
      role: 'user',
      content: 'What\'s the current status of production line A?',
      timestamp: '10:02 AM'
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Production Line A is currently operating at 77% capacity, which is 23% below expected performance. I\'ve detected an unusual delay pattern that started 2 hours ago. The issue appears to be related to material feed rate inconsistencies. Would you like me to suggest optimization strategies?',
      timestamp: '10:02 AM'
    }
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Listen for toggle event from command palette
  useEffect(() => {
    const handleToggle = () => setIsCollapsed(!isCollapsed);
    document.addEventListener('toggle-ai-panel', handleToggle);
    return () => document.removeEventListener('toggle-ai-panel', handleToggle);
  }, [isCollapsed]);

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

  // Mock AI insights data - in production, this would come from the backend
  const mockInsights: AIInsight[] = [
    {
      id: '1',
      type: 'anomaly',
      title: 'Unusual Production Delay Detected',
      description: 'Production line A is operating 23% below expected capacity',
      priority: 'high',
      timestamp: '2 minutes ago',
      actionable: true,
      impact: 'May delay 3 orders by 2-4 hours',
      recommendation: 'Reallocate resources from Line B or schedule overtime'
    },
    {
      id: '2',
      type: 'insight',
      title: 'Optimal Resource Allocation Found',
      description: 'Rescheduling Order #PO-2025-003 could improve overall efficiency by 15%',
      priority: 'medium',
      timestamp: '10 minutes ago',
      actionable: true,
      impact: 'Save 4 hours of production time',
      recommendation: 'Move to Tuesday morning slot'
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Preventive Maintenance Suggested',
      description: 'CNC Machine 1 showing early signs of wear',
      priority: 'medium',
      timestamp: '1 hour ago',
      actionable: true,
      impact: 'Prevent potential 8-hour downtime',
      recommendation: 'Schedule maintenance for next weekend'
    },
    {
      id: '4',
      type: 'simulation',
      title: 'What-If Scenario Available',
      description: 'Impact analysis for rush order insertion completed',
      priority: 'low',
      timestamp: '2 hours ago',
      actionable: false,
      impact: 'Minimal disruption with proper sequencing'
    }
  ];

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

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m analyzing your request and will provide insights based on current production data. Let me check the system for you...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold">Max AI Assistant</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed && "mx-auto")}
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
            <TabsList className="grid grid-cols-4 mx-4 mt-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
              <TabsTrigger value="simulations">Sims</TabsTrigger>
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
                          {message.content}
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
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask Max anything..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Max can help with scheduling, optimization, and insights
                </p>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="flex-1 overflow-hidden mt-2 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-3 pt-2 pb-4">
                {mockInsights
                  .filter(i => i.type === 'insight' || i.type === 'recommendation')
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
                {mockInsights
                  .filter(i => i.type === 'anomaly')
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

                {mockInsights
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
          </Tabs>
        </>
      )}

      {/* Collapsed state - show icon indicators */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Brain className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </Button>
          <Separator className="w-6" />
          <Button variant="ghost" size="icon" className="relative">
            <TrendingUp className="w-5 h-5" />
            <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              3
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              1
            </Badge>
          </Button>
          <Button variant="ghost" size="icon">
            <Activity className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}