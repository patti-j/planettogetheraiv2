import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Minimize2, 
  Maximize2, 
  X, 
  MessageSquare, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Settings,
  Volume2,
  VolumeX
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    page: string;
    action?: string;
    data?: any;
  };
}

interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization' | 'learning';
  title: string;
  message: string;
  confidence: number;
  actionable: boolean;
}

export default function IntegratedAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>([]);
  const [contextData, setContextData] = useState<any>({});
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Unable to process voice input. Please try again.",
          variant: "destructive",
        });
      };
    }

    if ('speechSynthesis' in window) {
      synthesis.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Monitor page context and generate insights
  useEffect(() => {
    const currentPage = window.location.pathname;
    const pageContext = {
      page: currentPage,
      timestamp: new Date(),
      user: user?.roles?.[0]?.name || user?.username
    };
    
    setContextData(pageContext);
    generatePageInsights(currentPage);
  }, [user, window.location.pathname]);

  const generatePageInsights = async (page: string) => {
    const insights: AIInsight[] = [];
    
    // Generate contextual insights based on current page
    switch (page) {
      case '/':
        insights.push({
          type: 'suggestion',
          title: 'Production Overview',
          message: 'I notice you\'re on the dashboard. Would you like me to analyze your current production metrics?',
          confidence: 0.8,
          actionable: true
        });
        break;
      case '/analytics':
        insights.push({
          type: 'optimization',
          title: 'Performance Insights',
          message: 'I can help identify bottlenecks in your current data. Shall I analyze the efficiency trends?',
          confidence: 0.9,
          actionable: true
        });
        break;
      case '/scheduling-optimizer':
        insights.push({
          type: 'learning',
          title: 'Scheduling Patterns',
          message: 'I\'ve learned from your scheduling patterns. I can suggest optimizations based on historical data.',
          confidence: 0.85,
          actionable: true
        });
        break;
      default:
        insights.push({
          type: 'suggestion',
          title: 'I\'m Here to Help',
          message: 'I\'m monitoring your workflow and ready to assist with any questions or optimizations.',
          confidence: 0.7,
          actionable: false
        });
    }
    
    setCurrentInsights(insights);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/chat", {
        message,
        context: contextData,
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: contextData
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response if voice is enabled
      if (isVoiceEnabled && synthesis.current) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        synthesis.current.speak(utterance);
      }
      
      // Generate follow-up insights based on conversation
      if (data.insights) {
        setCurrentInsights(data.insights);
      }
    },
    onError: (error) => {
      toast({
        title: "AI Assistant Error",
        description: "Unable to get response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context: contextData
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      setIsListening(false);
      recognition.current.stop();
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled && synthesis.current) {
      synthesis.current.cancel();
    }
  };

  const handleInsightAction = (insight: AIInsight) => {
    const contextMessage = `I'd like help with: ${insight.title} - ${insight.message}`;
    setInputMessage(contextMessage);
    setIsOpen(true);
    setIsMinimized(false);
  };

  // Floating assistant trigger
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Insights badge */}
        {currentInsights.length > 0 && (
          <div className="mb-2 space-y-2">
            {currentInsights.slice(0, 2).map((insight, index) => (
              <Card 
                key={index}
                className="w-72 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleInsightAction(insight)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      {insight.type === 'suggestion' && <Lightbulb className="h-4 w-4 text-yellow-500" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      {insight.type === 'optimization' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {insight.type === 'learning' && <Brain className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{insight.title}</p>
                      <p className="text-xs text-gray-600 truncate">{insight.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Main assistant button */}
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  // Full assistant interface
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 bg-white shadow-2xl transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[32rem]'}`}>
        <CardHeader className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-white" />
              <CardTitle className="text-white text-sm">Max AI Assistant</CardTitle>
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                {user?.roles?.[0]?.name || 'Online'}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                {isVoiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-full">
            {/* Current Insights */}
            {currentInsights.length > 0 && (
              <div className="p-3 bg-gray-50 border-b">
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Smart Insights
                </div>
                <div className="space-y-1">
                  {currentInsights.map((insight, index) => (
                    <div 
                      key={index}
                      className="text-xs bg-white p-2 rounded border cursor-pointer hover:bg-gray-50"
                      onClick={() => handleInsightAction(insight)}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {insight.type === 'suggestion' && <Lightbulb className="h-3 w-3 text-yellow-500" />}
                        {insight.type === 'warning' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                        {insight.type === 'optimization' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {insight.type === 'learning' && <Brain className="h-3 w-3 text-purple-500" />}
                        <span className="font-medium">{insight.title}</span>
                      </div>
                      <p className="text-gray-600">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Hi! I'm Max, your AI planning assistant.</p>
                    <p className="text-xs mt-1">I'm learning from your workflow to provide better suggestions.</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                      <div className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex gap-2">
                <div className="flex-1 flex gap-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your operations..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className={`px-2 ${isListening ? 'bg-red-50 border-red-200' : ''}`}
                  >
                    {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="px-3"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}