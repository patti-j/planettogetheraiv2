import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  MessageSquare, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Brain,
  Settings,
  Volume2,
  VolumeX,
  Database,
  Maximize,
  Minimize2,
  SplitSquareHorizontal,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Available AI voice options for OpenAI TTS
const VOICE_OPTIONS = [
  { value: 'alloy', name: 'Alloy', description: 'Balanced and versatile' },
  { value: 'echo', name: 'Echo', description: 'Clear and articulate' },
  { value: 'fable', name: 'Fable', description: 'Warm and engaging' },
  { value: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { value: 'nova', name: 'Nova', description: 'Bright and energetic' },
  { value: 'shimmer', name: 'Shimmer', description: 'Gentle and soothing' }
];

export function MaxSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    setMaxOpen, 
    isMobile, 
    mobileLayoutMode, 
    currentFullscreenView, 
    setMobileLayoutMode, 
    setCurrentFullscreenView 
  } = useMaxDock();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
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
  }, []);

  // Generate page insights
  useEffect(() => {
    const currentPage = window.location.pathname;
    generatePageInsights(currentPage);
  }, [window.location.pathname]);

  const generatePageInsights = async (page: string) => {
    const insights: AIInsight[] = [];
    
    // Generate contextual insights based on current page
    switch (page) {
      case '/':
        insights.push({
          type: 'optimization',
          title: 'Dashboard Efficiency',
          message: 'Consider customizing your dashboard layout for faster access to key metrics.',
          confidence: 0.8,
          actionable: true
        });
        break;
      case '/analytics':
        insights.push({
          type: 'suggestion',
          title: 'Data Analysis',
          message: 'Your production efficiency has improved 12% this week. Analyze the contributing factors.',
          confidence: 0.9,
          actionable: true
        });
        break;
    }
    
    setCurrentInsights(insights);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/ai-agent/chat', 'POST', {
        message,
        context: {
          page: window.location.pathname,
          user: user?.roles?.[0]?.name || user?.username,
          timestamp: new Date().toISOString()
        }
      });
      return response;
    },
    onSuccess: (response: any) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        context: {
          page: window.location.pathname
        }
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Play AI response if voice is enabled
      if (isVoiceEnabled && response.message) {
        playTTSResponse(response.message);
      }
    },
    onError: (error) => {
      toast({
        title: "AI Assistant Error",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      context: {
        page: window.location.pathname
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
  };

  const playTTSResponse = async (text: string) => {
    try {
      const response = await apiRequest(`/api/ai-agent/tts`, 'POST', { 
        text, 
        voice: selectedVoice 
      }) as { audioUrl?: string };

      if (response?.audioUrl) {
        if (currentAudio.current) {
          currentAudio.current.pause();
        }
        
        currentAudio.current = new Audio(response.audioUrl);
        await currentAudio.current.play();
      }
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  const handleInsightAction = (insight: AIInsight) => {
    setInputMessage(`Tell me more about: ${insight.title}`);
  };

  const testVoice = async () => {
    const testText = `Hello! This is the ${VOICE_OPTIONS.find(v => v.value === selectedVoice)?.name} voice.`;
    await playTTSResponse(testText);
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only trigger drag on the header area, not on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Dispatch custom event to parent SplitPaneLayout to start dragging
    const dragStartEvent = new CustomEvent('max-header-drag-start', {
      detail: { clientX: e.clientX, clientY: e.clientY }
    });
    window.dispatchEvent(dragStartEvent);
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    // Only trigger drag on the header area, not on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    const touch = e.touches[0];
    if (touch) {
      // Dispatch custom event to parent SplitPaneLayout to start dragging
      const dragStartEvent = new CustomEvent('max-header-drag-start', {
        detail: { clientX: touch.clientX, clientY: touch.clientY }
      });
      window.dispatchEvent(dragStartEvent);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Draggable for resizing */}
      <div 
        className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-between cursor-move"
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-center gap-2 ml-12">
          <Bot className="h-5 w-5 text-white" />
          <h2 className="text-white text-sm font-medium">Max AI Assistant</h2>
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
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            title="Voice Settings"
          >
            <Settings className="h-3 w-3" />
          </Button>
          
          {/* Mobile Layout Switcher - Only show on mobile */}
          {isMobile && (
            <>
              {mobileLayoutMode === 'split' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileLayoutMode('fullscreen')}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  title="Switch to Fullscreen Mode"
                >
                  <Maximize className="h-3 w-3" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFullscreenView(currentFullscreenView === 'main' ? 'max' : 'main')}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    title={`Switch to ${currentFullscreenView === 'main' ? 'Max' : 'Main Content'} View`}
                  >
                    {currentFullscreenView === 'main' ? <Bot className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileLayoutMode('split')}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    title="Switch to Split Mode"
                  >
                    <SplitSquareHorizontal className="h-3 w-3" />
                  </Button>
                </>
              )}
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMaxOpen(false)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            title="Close Max"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Voice Settings */}
      {showVoiceSettings && (
        <div className="p-3 bg-gray-50 border-b">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Voice Selection</div>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map(voice => (
                  <SelectItem key={voice.value} value={voice.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-gray-500">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={testVoice}
              className="w-full h-7 text-xs"
            >
              Test Voice
            </Button>
          </div>
        </div>
      )}

      {/* Current Insights - Hidden on mobile to save space */}
      {currentInsights.length > 0 && (
        <div className="p-3 bg-gray-50 border-b hidden md:block">
          <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Brain className="h-3 w-3" />
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
            className="px-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            {sendMessageMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}