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
  Eye,
  Dock,
  Move,
  Sparkles,
  Paperclip,
  StopCircle,
  Image,
  FileText,
  File
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMaxDock } from "@/contexts/MaxDockContext";

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
  const [isBubbleMinimized, setIsBubbleMinimized] = useState(false);
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
  
  // File attachment state
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    content?: string;
    url?: string;
    file: File;
  }>>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording state (replace basic browser speech with OpenAI)
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimeout, setRecordingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Calculate initial position and size based on screen size
  const getInitialDimensions = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Mobile-first responsive sizing
    if (screenWidth < 480) {
      return {
        width: Math.min(screenWidth - 20, 350), // Use almost full width on mobile
        height: Math.min(screenHeight - 80, 450), // Use more height on mobile
        x: Math.max(10, (screenWidth - Math.min(screenWidth - 20, 350)) / 2), // Center on mobile
        y: 40 // Position higher on mobile
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
  
  // Docking state - using placeholder since MaxDockContext doesn't have these properties
  const [isDocked, setIsDocked] = useState(false);
  const [dockPosition, setDockPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
  const [showDockZones, setShowDockZones] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Docking helper functions
  const getDockPosition = (): { x: number; y: number; width: number; height: number } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dockWidth = 400; // Fixed width when docked
    const dockHeight = Math.min(600, viewportHeight - 100); // Responsive height

    switch (dockPosition) {
      case 'left':
        return { x: 0, y: 50, width: dockWidth, height: dockHeight };
      case 'right':
        return { x: viewportWidth - dockWidth, y: 50, width: dockWidth, height: dockHeight };
      case 'top':
        return { x: Math.max(0, (viewportWidth - dockWidth) / 2), y: 0, width: dockWidth, height: 350 };
      case 'bottom':
        return { x: Math.max(0, (viewportWidth - dockWidth) / 2), y: viewportHeight - 400, width: dockWidth, height: 350 };
      default:
        return { x: position.x, y: position.y, width: size.width, height: size.height };
    }
  };

  const dockToPosition = (dock: 'left' | 'right' | 'top' | 'bottom') => {
    setShowDockZones(false);
    
    // Calculate dock position and size for full edge coverage
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dockWidth = 400;

    switch (dock) {
      case 'left':
        setPosition({ x: 0, y: 0 });
        setSize({ width: dockWidth, height: viewportHeight });
        setIsDocked(true);
        setDockPosition('left');
        break;
      case 'right':
        setPosition({ x: viewportWidth - dockWidth, y: 0 });
        setSize({ width: dockWidth, height: viewportHeight });
        setIsDocked(true);
        setDockPosition('right');
        break;
      case 'top':
        setPosition({ x: 0, y: 0 });
        setSize({ width: viewportWidth, height: 300 });
        setIsDocked(true);
        setDockPosition('top');
        break;
      case 'bottom':
        setPosition({ x: 0, y: viewportHeight - 300 });
        setSize({ width: viewportWidth, height: 300 });
        setIsDocked(true);
        setDockPosition('bottom');
        break;
    }
  };

  const undockWindow = () => {
    setIsDocked(false);
    setDockPosition('right');
    // Move to center of screen when undocking
    const centerX = Math.max(0, (window.innerWidth - 400) / 2);
    const centerY = Math.max(0, (window.innerHeight - 500) / 2);
    setPosition({ x: centerX, y: centerY });
    setSize({ width: 400, height: 500 });
  };

  // Mouse event handlers for dragging and resizing
  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    if (action === 'drag') {
      setIsDragging(true);
      setShowDockZones(true);
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
      // If currently docked, first undock the window
      if (isDocked) {
        setIsDocked(false);
        setDockPosition('right');
      }
      
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

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      // Check if mouse is in a dock zone
      const threshold = 80; // pixels from edge to trigger docking (increased for easier targeting)
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      console.log('Mouse up at:', clientX, clientY, 'Window size:', innerWidth, innerHeight);
      console.log('Dock thresholds - Left:', threshold, 'Right:', innerWidth - threshold, 'Top:', threshold, 'Bottom:', innerHeight - threshold);

      if (clientX <= threshold) {
        console.log('Docking left');
        dockToPosition('left');
      } else if (clientX >= innerWidth - threshold) {
        console.log('Docking right');
        dockToPosition('right');
      } else if (clientY <= threshold) {
        console.log('Docking top');
        dockToPosition('top');
      } else if (clientY >= innerHeight - threshold) {
        console.log('Docking bottom');
        dockToPosition('bottom');
      } else {
        console.log('No docking, hiding dock zones');
        setShowDockZones(false);
      }
    }
    
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
      if (isDocked && dockPosition) {
        // Recalculate docked position when window resizes
        dockToPosition(dockPosition);
      } else {
        const newDimensions = getInitialDimensions();
        
        // Adjust position to stay within bounds
        setPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - size.width),
          y: Math.min(prev.y, window.innerHeight - size.height)
        }));
        
        // On mobile, reset to appropriate size
        if (window.innerWidth < 480) {
          setSize({
            width: newDimensions.width,
            height: newDimensions.height
          });
        }
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size, isDocked, dockPosition, dockToPosition]);

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

  // Clear all memories
  const clearAllMemories = async () => {
    try {
      await apiRequest("POST", "/api/ai-agent/memory/clear");
      await fetchMemoryData(); // Refresh data
      toast({
        title: "Memories Cleared",
        description: "All of Max's memories have been cleared.",
      });
    } catch (error) {
      console.error('Error clearing memories:', error);
      toast({
        title: "Error",
        description: "Failed to clear memories.",
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
      console.log('🚀 [AI Assistant] Sending message to Max AI:', message);
      const response = await apiRequest("POST", "/api/max-ai/chat", {
        message: message,
        attachments: attachments.map(a => ({ name: a.name, type: a.type, size: a.size, content: a.content, url: a.url })),
        context: {
          ...contextData,
          currentPage: window.location.pathname,
          userRole: 'Administrator'
        },
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });
      console.log('📨 [AI Assistant] Response received from Max AI');
      return await response.json();
    },
    onSuccess: (data) => {
      // Debug: Log the full response to see structure
      console.log('🔍 [AI Assistant] Full response data:', data);
      console.log('🔍 [AI Assistant] Action present:', !!data.action);
      console.log('🔍 [AI Assistant] Action type:', data.action?.type);
      
      // Handle both 'response' and 'message' fields from backend
      const responseText = data.response || data.message || data.reply || 'No response received';
      
      // Check if there's an action (like chart creation)
      let finalContent = responseText;
      
      if (data.action && data.action.type === 'create_chart' && data.action.chartConfig) {
        // Create a visual chart representation
        const chartConfig = data.action.chartConfig;
        const chartData = chartConfig.data || [];
        
        // Create a simple ASCII-style chart representation for now
        let chartVisual = '\n\n📊 **' + chartConfig.title + '**\n\n';
        
        if (chartConfig.type === 'bar' || chartConfig.type === 'pie') {
          chartData.forEach((item: any, index: number) => {
            const value = item.value || item.count || 0;
            const label = item.label || item.name || `Item ${index + 1}`;
            const barLength = Math.max(1, Math.floor((value / Math.max(...chartData.map((d: any) => d.value || d.count || 0))) * 20));
            const bar = '█'.repeat(barLength);
            chartVisual += `${label}: ${bar} ${value}\n`;
          });
        } else {
          // For other chart types, show data in a table format
          chartData.forEach((item: any, index: number) => {
            const value = item.value || item.count || 0;
            const label = item.label || item.name || `Item ${index + 1}`;
            chartVisual += `• ${label}: ${value}\n`;
          });
        }
        
        chartVisual += '\n💡 *This chart shows real manufacturing data from your system*';
        finalContent = responseText + chartVisual;
        
        // Also try to navigate to canvas if the user is not already there
        if (window.location.pathname !== '/canvas') {
          setTimeout(() => {
            window.location.href = '/canvas';
          }, 2000);
        }
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: finalContent,
        timestamp: new Date(),
        context: contextData
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setAttachments([]);
      
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

  const startListening = async () => {
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      // Check supported MIME types and use the best one for Whisper API
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      let selectedMimeType = 'audio/webm'; // Default fallback
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('✅ Using MIME type:', mimeType);
          break;
        }
      }
      
      const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        console.log('📊 Audio data available, size:', e.data.size);
        chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio...');
        // Use the actual MIME type from the MediaRecorder
        const blob = new Blob(chunks, { type: selectedMimeType });
        console.log('📄 Audio blob created, size:', blob.size, 'type:', blob.type);
        await handleAudioRecording(blob);
        stream.getTracks().forEach(track => track.stop());
        console.log('🔇 Microphone stream closed');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsListening(true);
      setRecordingTimeLeft(10);
      console.log('🔴 Recording started');

      // Start countdown timer
      const interval = setInterval(() => {
        setRecordingTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            stopListening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        stopListening();
      }, 10000);

      setRecordingTimeout(timeout);
    } catch (error: any) {
      console.error('❌ Microphone access error:', error);
      let errorMessage = "Unable to access microphone. Please check permissions.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone access denied. Please allow microphone permissions in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is being used by another application. Please close other apps using the microphone.";
      }
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }
    setIsRecording(false);
    setIsListening(false);
    setRecordingTimeLeft(0);
  };

  const handleAudioRecording = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      console.log('📤 Uploading audio for transcription, type:', audioBlob.type, 'size:', audioBlob.size);
      
      // Determine file extension based on MIME type
      const mimeToExt: Record<string, string> = {
        'audio/webm': 'webm',
        'audio/webm;codecs=opus': 'webm',
        'audio/ogg;codecs=opus': 'ogg',
        'audio/ogg': 'ogg',
        'audio/mp4': 'mp4',
        'audio/wav': 'wav',
      };
      
      const extension = mimeToExt[audioBlob.type] || 'webm';
      const filename = `recording.${extension}`;
      console.log('📝 Using filename:', filename);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);
      
      const response = await fetch('/api/ai-agent/voice', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setInputMessage(data.text);
        }
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      toast({
        title: "Transcription Error",
        description: "Unable to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // File attachment handlers
  const MAX_FILE_MB = 8;
  const handlePickFiles = () => fileInputRef.current?.click();
  const handleRemoveAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsDragOver(false); 
    if (e.dataTransfer?.files?.length) processFiles(e.dataTransfer.files); 
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files?.length) processFiles(e.target.files); 
    e.target.value = ""; 
  };
  const processFiles = async (files: FileList | File[]) => {
    setIsProcessingFiles(true);
    try {
      const items = await Promise.all(Array.from(files).map(async (file) => {
        if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`File too large: ${file.name}`);
        const id = `${Date.now()}_${file.name}`;
        let content: string | undefined;
        let url: string | undefined;
        if (file.type.startsWith('image/')) {
          const buf = await file.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          content = `data:${file.type};base64,${b64}`;
        } else if (file.type.startsWith('text/') || file.type === 'application/json') {
          content = await file.text();
        } else if (file.type === 'application/pdf') {
          const buf = await file.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          content = `data:${file.type};base64,${b64}`;
        }
        return { id, name: file.name, type: file.type, size: file.size, content, url, file };
      }));
      setAttachments(prev => [...prev, ...items]);
    } catch (err: any) {
      toast({ title: 'File error', description: err?.message || 'Failed to add files', variant: 'destructive' });
    } finally { 
      setIsProcessingFiles(false); 
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
                      {insight.type === 'learning' && <Sparkles className="h-4 w-4 text-purple-500" />}
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
        
        {/* AI Bubble - Toggle between oval prompt and circular icon */}
        <div className="relative">
          {isBubbleMinimized ? (
            // Minimized circular icon
            <Button
              onClick={() => setIsBubbleMinimized(false)}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-expand-ai-bubble"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </Button>
          ) : (
            // Expanded oval prompt
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3 flex items-center gap-3 cursor-pointer"
                 onClick={() => setIsOpen(true)}
                 data-testid="button-ask-anything"
            >
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBubbleMinimized(true);
                }}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-white/20 text-white"
                data-testid="button-minimize-ai-bubble"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <span className="text-white font-medium text-sm whitespace-nowrap">
                Ask anything...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full assistant interface - draggable and resizable
  return (
    <div 
      className={`fixed z-50 ${isDocked ? 'z-40' : 'z-50'}`}
      style={{
        left: isDocked ? (dockPosition === 'left' ? 0 : dockPosition === 'right' ? window.innerWidth - size.width : position.x) : position.x,
        top: isDocked ? (dockPosition === 'top' ? 0 : dockPosition === 'bottom' ? window.innerHeight - size.height : 0) : position.y,
        width: isDocked ? (dockPosition === 'left' || dockPosition === 'right' ? size.width : window.innerWidth) : size.width,
        height: isDocked ? (dockPosition === 'top' || dockPosition === 'bottom' ? size.height : window.innerHeight) : (isMinimized ? 'auto' : size.height)
      }}
    >
      <Card 
        className={`bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 relative ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'select-none' : ''} ${isDocked ? 'border-2 border-blue-400 shadow-none' : ''}`} 
        style={{ width: '100%', height: '100%' }}
      >
        <CardHeader 
          className={`p-4 bg-gradient-to-r from-blue-500 to-indigo-600 ${isDocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
          onMouseDown={!isDocked ? (e) => handleMouseDown(e, 'drag') : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <CardTitle className="text-white text-sm">Max</CardTitle>
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
                onClick={isDocked ? undockWindow : () => setShowDockZones(!showDockZones)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                title={isDocked ? "Undock Window" : "Dock Window"}
              >
                {isDocked ? <Move className="h-3 w-3" /> : <Dock className="h-3 w-3" />}
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
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b">
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
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b max-h-64 overflow-y-auto">
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
                      <Sparkles className="h-3 w-3" />
                      What Max Remembers ({memoryData.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {memoryData.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No memories recorded yet</p>
                      ) : (
                        memoryData.map((memory, index) => (
                          <div key={index} className="p-2 bg-white dark:bg-gray-700 rounded border text-xs">
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

                  {/* Memory Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchMemoryData}
                      className="h-7 text-xs flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearAllMemories}
                      className="h-7 text-xs flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>

                  {/* Training Data Section */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Conversation Context ({trainingData.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {trainingData.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No conversation context available</p>
                      ) : (
                        trainingData.map((training, index) => (
                          <div key={index} className="p-2 bg-white dark:bg-gray-700 rounded border text-xs">
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
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b">
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Smart Insights
                </div>
                <div className="space-y-1">
                  {currentInsights.map((insight, index) => (
                    <div 
                      key={index}
                      className="text-xs bg-white dark:bg-gray-700 p-2 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                      onClick={() => handleInsightAction(insight)}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {insight.type === 'suggestion' && <Lightbulb className="h-3 w-3 text-yellow-500" />}
                        {insight.type === 'warning' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                        {insight.type === 'optimization' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {insight.type === 'learning' && <Sparkles className="h-3 w-3 text-purple-500" />}
                        <span className="font-medium">{insight.title}</span>
                      </div>
                      <p className="text-gray-600">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto" 
                 style={{ 
                   minHeight: '200px',
                   maxHeight: window.innerWidth < 480 ? '300px' : `${size.height - 200}px`
                 }}>
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
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
                      className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
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
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-gray-50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your operations..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 resize-none"
                    rows={window.innerWidth < 768 ? 2 : 2}
                    style={{ minHeight: '40px' }}
                  />
                  {attachments.length > 0 && (
                    <div className="px-3 py-2 space-y-1 border-t border-gray-200" data-testid="list-attachments">
                      {attachments.map(a => (
                        <div key={a.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                          <FileText className="h-3 w-3 text-gray-500" />
                          <span className="truncate flex-1">{a.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveAttachment(a.id)} 
                            className="h-5 w-5 p-0"
                            data-testid={`button-remove-attachment-${a.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input 
                    hidden 
                    multiple 
                    ref={fileInputRef} 
                    type="file" 
                    onChange={handleFileInput} 
                    data-testid="input-attach-files" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePickFiles} 
                    className="px-2 h-10" 
                    title="Attach files" 
                    data-testid="button-attach-files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isListening ? stopListening : startListening}
                      className={`px-2 h-10 ${isListening ? 'bg-red-50 border-red-200' : ''}`}
                      data-testid="button-voice-recording"
                    >
                      {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    {isListening && recordingTimeLeft > 0 && (
                      <span className="text-xs font-mono text-red-500 min-w-[2ch]" data-testid="text-recording-countdown">
                        {recordingTimeLeft}s
                      </span>
                    )}
                    {isTranscribing && (
                      <span className="text-xs text-blue-500" data-testid="text-transcribing-status">
                        Processing...
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="px-3 h-10 w-full sm:w-auto"
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
        
        {/* Resize Handle - Only show when not docked and not minimized */}
        {!isMinimized && !isDocked && (
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

      {/* Dock Zones - Visual indicators when dragging */}
      {showDockZones && (
        <>
          {/* Left dock zone */}
          <div 
            className="fixed left-0 top-20 w-20 h-[calc(100vh-80px)] bg-blue-500/30 border-r-4 border-blue-500 z-20 flex items-center justify-center pointer-events-none"
            style={{ opacity: isDragging ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            <div className="text-blue-600 font-bold text-lg rotate-90">DOCK LEFT</div>
          </div>
          
          {/* Right dock zone */}
          <div 
            className="fixed right-0 top-20 w-20 h-[calc(100vh-80px)] bg-blue-500/30 border-l-4 border-blue-500 z-20 flex items-center justify-center pointer-events-none"
            style={{ opacity: isDragging ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            <div className="text-blue-600 font-bold text-lg rotate-90">DOCK RIGHT</div>
          </div>
          
          {/* Top dock zone */}
          <div 
            className="fixed top-20 left-20 w-[calc(100vw-40px)] h-20 bg-blue-500/30 border-b-4 border-blue-500 z-20 flex items-center justify-center pointer-events-none"
            style={{ opacity: isDragging ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            <div className="text-blue-600 font-bold text-lg">DOCK TOP</div>
          </div>
          
          {/* Bottom dock zone */}
          <div 
            className="fixed bottom-0 left-20 w-[calc(100vw-40px)] h-20 bg-blue-500/30 border-t-4 border-blue-500 z-20 flex items-center justify-center pointer-events-none"
            style={{ opacity: isDragging ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            <div className="text-blue-600 font-bold text-lg">DOCK BOTTOM</div>
          </div>
        </>
      )}
    </div>
  );
}