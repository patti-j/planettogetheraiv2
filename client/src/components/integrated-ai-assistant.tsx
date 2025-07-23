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
  VolumeX,
  Database,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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

export default function IntegratedAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>([]);
  const [contextData, setContextData] = useState<any>({});
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showMemorySettings, setShowMemorySettings] = useState(false);
  const [memoryData, setMemoryData] = useState<any[]>([]);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  
  // Calculate initial position and size based on screen size
  const getInitialDimensions = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Mobile-first responsive sizing
    if (screenWidth < 768) {
      return {
        width: Math.min(320, screenWidth - 40),
        height: Math.min(400, screenHeight - 100),
        x: Math.max(20, screenWidth - Math.min(320, screenWidth - 40) - 20),
        y: 80
      };
    } else {
      return {
        width: 384,
        height: 500,
        x: screenWidth - 420,
        y: 50
      };
    }
  };

  // Dragging and resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState(() => {
    const initial = getInitialDimensions();
    return { x: initial.x, y: initial.y };
  });
  const [size, setSize] = useState(() => {
    const initial = getInitialDimensions();
    return { width: initial.width, height: initial.height };
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Mouse event handlers for dragging and resizing
  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    if (action === 'drag') {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(320, Math.min(Math.min(800, window.innerWidth - position.x - 20), resizeStart.width + deltaX));
      const newHeight = Math.max(300, Math.min(window.innerHeight - position.y - 20, resizeStart.height + deltaY));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, position, size]);

  // Update position and size when window resizes
  useEffect(() => {
    const handleWindowResize = () => {
      const newDimensions = getInitialDimensions();
      
      // Adjust position to stay within bounds
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - size.width),
        y: Math.min(prev.y, window.innerHeight - size.height)
      }));
      
      // On mobile, reset to appropriate size
      if (window.innerWidth < 768) {
        setSize({
          width: newDimensions.width,
          height: newDimensions.height
        });
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size]);

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

  // AI Text-to-Speech function
  const speakWithAI = async (text: string) => {
    if (!text) return;
    
    try {
      // Stop any currently playing audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
      
      const response = await apiRequest("POST", "/api/ai-agent/tts", {
        text: text,
        voice: selectedVoice
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        currentAudio.current = audio;
        
        audio.onended = () => {
          currentAudio.current = null;
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('AI TTS Error:', error);
      // Fallback to browser TTS
      if (synthesis.current) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        synthesis.current.speak(utterance);
      }
    }
  };

  // Fetch memory and training data
  const fetchMemoryData = async () => {
    try {
      const response = await apiRequest("GET", "/api/ai-agent/memory");
      const data = await response.json();
      setMemoryData(data.memories || []);
      setTrainingData(data.training || []);
    } catch (error) {
      console.error('Error fetching memory data:', error);
    }
  };

  // Delete memory entry
  const deleteMemoryEntry = async (entryId: string) => {
    try {
      await apiRequest("DELETE", `/api/ai-agent/memory/${entryId}`);
      await fetchMemoryData(); // Refresh data
      toast({
        title: "Memory Entry Deleted",
        description: "The memory entry has been removed from Max's training data.",
      });
    } catch (error) {
      console.error('Error deleting memory entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete memory entry.",
        variant: "destructive",
      });
    }
  };

  // Update training data
  const updateTrainingEntry = async (entryId: string, newContent: string) => {
    try {
      await apiRequest("PUT", `/api/ai-agent/training/${entryId}`, {
        content: newContent
      });
      await fetchMemoryData(); // Refresh data
      toast({
        title: "Training Updated",
        description: "Max's training data has been updated.",
      });
    } catch (error) {
      console.error('Error updating training entry:', error);
      toast({
        title: "Error",
        description: "Failed to update training data.",
        variant: "destructive",
      });
    }
  };

  // Toggle voice functionality
  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
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
      if (isVoiceEnabled) {
        // Use OpenAI TTS with selected voice
        speakWithAI(data.response);
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

  // Full assistant interface - draggable and resizable
  return (
    <div 
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height
      }}
    >
      <Card className={`bg-white shadow-2xl transition-all duration-300 relative ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'select-none' : ''}`} style={{ width: '100%', height: '100%' }}>
        <CardHeader 
          className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
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
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                title="Voice Settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMemorySettings(!showMemorySettings);
                  if (!showMemorySettings) {
                    fetchMemoryData();
                  }
                }}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                title="Memory & Training"
              >
                <Database className="h-3 w-3" />
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
          <CardContent className="p-0 flex flex-col relative" style={{ height: `${size.height - 80}px`, overflow: 'hidden' }}>
            {/* Voice Settings Panel */}
            {showVoiceSettings && (
              <div className="p-3 bg-gray-50 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Voice Settings</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVoiceSettings(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">AI Voice</label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_OPTIONS.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{voice.name}</span>
                              <span className="text-xs text-gray-500">{voice.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => speakWithAI("Hello! This is how I sound with the " + VOICE_OPTIONS.find(v => v.value === selectedVoice)?.name + " voice.")}
                    className="w-full h-7 text-xs"
                  >
                    Test Voice
                  </Button>
                </div>
              </div>
            )}

            {/* Memory & Training Settings Panel */}
            {showMemorySettings && (
              <div className="p-3 bg-gray-50 border-b max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Memory & Training</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMemorySettings(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Memory Section */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      What Max Remembers ({memoryData.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {memoryData.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No memories recorded yet</p>
                      ) : (
                        memoryData.map((memory, index) => (
                          <div key={index} className="p-2 bg-white rounded border text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-700">{memory.type}</p>
                                <p className="text-gray-600">{memory.content}</p>
                                <p className="text-gray-400 text-xs mt-1">{memory.timestamp}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMemoryEntry(memory.id)}
                                className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Training Data Section */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Training Data ({trainingData.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {trainingData.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No training data available</p>
                      ) : (
                        trainingData.map((training, index) => (
                          <div key={index} className="p-2 bg-white rounded border text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-700">{training.category}</p>
                                <p className="text-gray-600">{training.pattern}</p>
                                <p className="text-gray-400 text-xs mt-1">Confidence: {training.confidence}%</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newContent = prompt('Edit training pattern:', training.pattern);
                                    if (newContent && newContent !== training.pattern) {
                                      updateTrainingEntry(training.id, newContent);
                                    }
                                  }}
                                  className="h-5 w-5 p-0 text-blue-500 hover:text-blue-700"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMemoryEntry(training.id)}
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMemoryData}
                    className="w-full h-7 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Refresh Memory Data
                  </Button>
                </div>
              </div>
            )}
            
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
            <ScrollArea className="flex-1 p-3 min-h-0" style={{ maxHeight: `${size.height - 200}px` }}>
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
            <div className="p-3 border-t bg-gray-50 flex-shrink-0">
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
        
        {/* Resize Handle */}
        {!isMinimized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gradient-to-br from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 transition-colors opacity-70 hover:opacity-100"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
            style={{
              clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
            }}
            title="Drag to resize"
          />
        )}
      </Card>
    </div>
  );
}