import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, 
  Bot, 
  Calendar,
  Package,
  Users,
  FileText,
  CheckCircle,
  Activity,
  AlertTriangle,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  estimatedImpact: string;
  createdAt: string;
  aiAgent: string;
  situation?: string;
  analysis?: string;
  recommendedAction?: string;
  expectedImpact?: {
    temperature?: string;
    qualityRisk?: string;
    efficiency?: string;
  };
}

interface WorkWithAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ActionRecommendation | null;
}

export function WorkWithAgentModal({ isOpen, onClose, recommendation }: WorkWithAgentModalProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isDetailsMinimized, setIsDetailsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize with welcome message from agent
  useEffect(() => {
    if (isOpen && recommendation && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        type: 'assistant',
        content: `Hello! I'm the Production Scheduling Agent. I'm here to help you resolve: "${recommendation.title}"\n\nI can help you:\n• Analyze the situation and provide recommendations\n• Execute scheduling algorithms (ASAP, ALAP)\n• Check resource availability\n• Review job priorities\n\nHow can I assist you with this action?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, recommendation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/max-ai/chat", {
        message: message,
        context: {
          page: 'action-resolution',
          currentPage: '/action-resolution',
          agent: 'production_scheduling',
          recommendation: recommendation,
          userRole: 'Administrator'
        },
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add assistant's response to messages
      const assistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        content: data.response || data.message || data.reply || 'I received your message.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to API
    sendMessageMutation.mutate(inputMessage);
    
    // Clear input
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !sendMessageMutation.isPending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !recommendation) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };


  const systemTools = [
    {
      icon: Calendar,
      title: 'Production Schedule',
      description: 'View current production timeline',
      color: 'text-blue-600',
      path: '/production-scheduler'
    },
    {
      icon: Package,
      title: 'Inventory Status',
      description: 'Check stock levels and availability',
      color: 'text-green-600',
      path: '/inventory-optimization'
    },
    {
      icon: Users,
      title: 'Resource Allocation',
      description: 'View staff and equipment assignments',
      color: 'text-purple-600',
      path: '/labor-planning'
    },
    {
      icon: FileText,
      title: 'Work Orders',
      description: 'Review active work orders',
      color: 'text-orange-600',
      path: '/production-planning'
    }
  ];

  const handleToolClick = (path: string) => {
    setLocation(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Dashboard</span>
            <span>/</span>
            <span>Production Scheduling</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">Action Resolution</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <div className="text-right">
            <div className="text-sm font-medium">Resolving with Production Scheduling</div>
            <div className="text-xs text-gray-500">Production Agent</div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Action Details (Collapsible) */}
        <div className={`${isDetailsMinimized ? 'w-12' : 'w-80'} border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            {/* Minimize/Expand Button */}
            <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsMinimized(!isDetailsMinimized)}
                className="h-8 w-8 p-0"
                data-testid="toggle-details-panel"
              >
                {isDetailsMinimized ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Content - hidden when minimized */}
            {!isDetailsMinimized && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Action Details</h2>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      pending
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">{recommendation.title}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Situation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recommendation.situation || 
                         "Station 7 temperature sensor reading 185°F, approaching critical threshold of 200°F. This is causing reduced efficiency and potential quality risks."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Analysis</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recommendation.analysis || 
                         "High temperatures can damage components and affect product quality. Immediate action prevents costly downtime and maintains production targets."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Action</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recommendation.recommendedAction || 
                         "Reduce line speed by 5% and activate secondary cooling system. Schedule maintenance for cooling unit during next planned downtime."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Expected Impact</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                          <span>185°F → 165°F</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Quality Risk:</span>
                          <span>Medium → Low</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                          <span>87% → 90%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Minimized state - show icon only */}
            {isDetailsMinimized && (
              <div className="flex-1 flex items-start justify-center pt-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            )}
          </div>
        </div>

        {/* Resizable Panel Group for Center and Right Panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Center Panel - Agent Conversation */}
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="flex flex-col h-full bg-white dark:bg-gray-800">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Discuss with Production Scheduling</h3>
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Connected
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Work together to resolve: {recommendation.title}
                </p>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${message.type}-${message.id}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    className="gap-2"
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Resizable Handle */}
          <ResizableHandle withHandle className="w-[6px] bg-gradient-to-r from-border/40 via-border/60 to-border/40 hover:from-primary/15 hover:via-primary/25 hover:to-primary/15 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />

          {/* Right Panel - System Tools */}
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">System Tools</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Select a tool to help resolve this action:
                </p>

                <div className="space-y-3">
                  {systemTools.map((tool, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => handleToolClick(tool.path)}
                      data-testid={`system-tool-${index}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${tool.color}`}>
                            <tool.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{tool.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}