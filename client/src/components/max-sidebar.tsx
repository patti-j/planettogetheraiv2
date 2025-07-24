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
import { useAITheme } from "@/hooks/use-ai-theme";
import { useLocation } from "wouter";
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
  SplitSquareVertical,
  Monitor,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_THEME_OPTIONS, AIThemeColor } from "@/lib/ai-theme";
import { MaxCanvas } from "@/components/max-canvas";

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
  canvasAction?: {
    type: 'create' | 'update' | 'clear';
    items?: CanvasItem[];
  };
}

interface CanvasItem {
  id: string;
  type: 'dashboard' | 'chart' | 'table' | 'image' | 'interactive' | 'custom';
  title: string;
  content: any;
  width?: string;
  height?: string;
  position?: { x: number; y: number };
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

function AIThemeSelector() {
  const { currentTheme, updateTheme, isUpdating } = useAITheme();

  return (
    <Select 
      value={currentTheme} 
      onValueChange={(value: AIThemeColor) => updateTheme(value)}
      disabled={isUpdating}
    >
      <SelectTrigger className="h-7 text-xs">
        <SelectValue>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full flex-shrink-0 ${AI_THEME_OPTIONS[currentTheme]?.preview || 'bg-gray-300'}`}
            />
            <span className="truncate">{AI_THEME_OPTIONS[currentTheme]?.name || 'Select Theme'}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(AI_THEME_OPTIONS).map(([key, config]) => (
          <SelectItem key={key} value={key}>
            <div className="flex items-center space-x-3 py-1">
              <div 
                className={`w-4 h-4 rounded-full flex-shrink-0 ${config.preview}`}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-medium">{config.name}</span>
                <span className="text-xs text-gray-500">{config.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MaxSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { 
    setMaxOpen, 
    isMobile, 
    mobileLayoutMode, 
    currentFullscreenView, 
    isCanvasVisible,
    setMobileLayoutMode, 
    setCurrentFullscreenView,
    setCanvasVisible
  } = useMaxDock();
  const { getThemeClasses } = useAITheme();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  
  // Canvas session ID
  const [canvasSessionId] = useState(() => `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Expose canvas control for Max AI
  useEffect(() => {
    (window as any).openCanvas = () => setCanvasVisible(true);
    (window as any).closeCanvas = () => setCanvasVisible(false);
    
    return () => {
      delete (window as any).openCanvas;
      delete (window as any).closeCanvas;
    };
  }, [setCanvasVisible]);
  
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
      console.log('Initializing speech recognition...');
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.current.onresult = (event: any) => {
        console.log('Speech recognition result:', event.results);
        const transcript = event.results[0][0].transcript;
        console.log('Transcript:', transcript);
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = "I couldn't catch what you said. Please try speaking again or type your message instead.";
        
        // Provide specific error messages based on error type
        switch (event.error) {
          case 'not-allowed':
            errorMessage = "Microphone access was denied. Please allow microphone permission in your browser settings and try again.";
            break;
          case 'no-speech':
            errorMessage = "I didn't hear anything. Please speak clearly and try again.";
            break;
          case 'network':
            errorMessage = "Network error occurred. Please check your connection and try again.";
            break;
        }
        
        // Show a gentle message in chat instead of error toast
        const voiceErrorMessage: Message = {
          id: Date.now().toString() + '_voice_error',
          type: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          context: {
            page: window.location.pathname,
            action: 'voice_error'
          }
        };
        setMessages(prev => [...prev, voiceErrorMessage]);
      };
      
      console.log('Speech recognition initialized successfully');
    } else {
      console.log('Speech recognition not supported in this browser');
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
      const response = await apiRequest('POST', '/api/ai-agent/chat', {
        message,
        context: {
          page: window.location.pathname,
          user: user?.roles?.[0]?.name || user?.username,
          timestamp: new Date().toISOString()
        }
      });
      return await response.json();
    },
    onSuccess: (response: any) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        context: {
          page: window.location.pathname
        },
        canvasAction: response.canvasAction
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle canvas actions
      if (response.canvasAction) {
        handleCanvasAction(response.canvasAction);
      }

      // Play AI response if voice is enabled
      if (isVoiceEnabled && response.message) {
        playTTSResponse(response.message);
      }
    },
    onError: (error: any) => {
      // Instead of showing error toast, display helpful message in chat
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: "I apologize, but I'm unable to help with that request right now. This might be because:\n\n• The request requires capabilities I don't currently have\n• There's a temporary connectivity issue\n• The request involves sensitive operations I cannot perform\n\nPlease try rephrasing your request or ask me about something else I can help with, like analyzing your production data, optimizing schedules, or explaining system features.",
        timestamp: new Date(),
        context: {
          page: window.location.pathname,
          action: 'error_response'
        }
      };
      setMessages(prev => [...prev, errorMessage]);

      // Play error response if voice is enabled
      if (isVoiceEnabled) {
        playTTSResponse("I'm sorry, but I'm unable to help with that request right now. Please try asking me something else.");
      }
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
    if (!recognition.current) {
      console.log('Speech recognition not available');
      const noSpeechMessage: Message = {
        id: Date.now().toString() + '_no_speech',
        type: 'assistant',
        content: "Speech recognition is not available in your browser. Please type your message instead.",
        timestamp: new Date(),
        context: {
          page: window.location.pathname
        }
      };
      setMessages(prev => [...prev, noSpeechMessage]);
      return;
    }

    try {
      console.log('Starting speech recognition...');
      recognition.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
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
      const response = await apiRequest('POST', '/api/ai-agent/tts', { 
        text, 
        voice: selectedVoice 
      });
      const data = await response.json() as { audioUrl?: string };

      if (data?.audioUrl) {
        if (currentAudio.current) {
          currentAudio.current.pause();
        }
        
        currentAudio.current = new Audio(data.audioUrl);
        await currentAudio.current.play();
      }
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  const handleInsightAction = (insight: AIInsight) => {
    setInputMessage(`Tell me more about: ${insight.title}`);
  };

  const handleCanvasAction = (canvasAction: any) => {
    if (!canvasAction) return;
    
    switch (canvasAction.type) {
      case 'create':
        if (canvasAction.items) {
          setCanvasItems(canvasAction.items);
          // Auto-show canvas in split-pane layout using context
          setCanvasVisible(true);
        }
        break;
      case 'update':
        if (canvasAction.items) {
          setCanvasItems(prev => [...prev, ...canvasAction.items]);
          // Auto-show canvas in split-pane layout using context
          setCanvasVisible(true);
        }
        break;
      case 'clear':
        setCanvasItems([]);
        break;
      case 'SHOW_CANVAS':
        setCanvasVisible(true);
        break;
      case 'HIDE_CANVAS':
        setCanvasVisible(false);
        break;
      case 'ADD_CANVAS_CONTENT':
        if (canvasAction.content) {
          const newItem: CanvasItem = {
            id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: canvasAction.content.type || 'custom',
            title: canvasAction.content.title || 'AI Generated Content',
            content: canvasAction.content.data || canvasAction.content,
            width: canvasAction.content.width || '100%',
            height: canvasAction.content.height || 'auto'
          };
          setCanvasItems(prev => [newItem, ...prev]); // Add to top
          setCanvasVisible(true); // Auto-show canvas when content is added
        }
        break;
    }
  };

  const toggleCanvas = () => {
    setCanvasVisible(!isCanvasVisible);
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
        className={`p-4 ${getThemeClasses(false)} flex items-center justify-between cursor-move`}
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-center gap-2 ml-12">
          <Bot className="h-5 w-5 text-white" />
          <h2 className="text-white text-sm font-medium">Max AI Assistant</h2>
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

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCanvas}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            title="Canvas"
          >
            <Monitor className="h-3 w-3" />
          </Button>
          
          {/* Mobile Layout Switcher - Only show on mobile */}
          {isMobile && (
            <>
              {mobileLayoutMode === 'split' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileLayoutMode('fullscreen');
                    setCurrentFullscreenView('max'); // Show Max by default when entering fullscreen
                  }}
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
                    <SplitSquareVertical className="h-3 w-3" />
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
          <div className="space-y-3">
            {/* Voice Selection */}
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

            {/* AI Theme Selection */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">AI Theme</div>
              <AIThemeSelector />
            </div>
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
            className={`px-3 ${getThemeClasses()}`}
          >
            {sendMessageMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Canvas Component */}
      <MaxCanvas
        isVisible={isCanvasVisible}
        onClose={() => setCanvasVisible(false)}
        sessionId={canvasSessionId}
      />
    </div>
  );
}