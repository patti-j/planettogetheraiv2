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
import type { CanvasItem } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useLocation } from "wouter";
import { useTour } from "@/contexts/TourContext";
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard";
import { useSplitScreen } from "@/contexts/SplitScreenContext";
import { AIReasoning } from "@/components/max-ai-reasoning";
// import { SchedulerContextService } from "@/services/scheduler/SchedulerContextService";
import { useAgent } from "@/contexts/AgentContext";
import { useAgentAnalysis } from "@/hooks/useAgentAnalysis";
import { AgentSelector } from "@/components/agent-selector";
import type { AgentMessage } from "@/types/agents";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  MessageSquare, 
  Lightbulb,
  TrendingUp,
  TrendingDown,
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
  Share2,
  Copy,
  Sparkles,
  Calendar,
  BarChart3,
  Clock,
  AlertCircle,
  Target,
  Zap,
  Factory,
  Package,
  Layers,
  Shield,
  Wrench,
  Truck,
  TrendingUp as TrendingUpIcon,
  DollarSign,
  CheckCircle,
  Play,
  Eye,
  ChevronDown,
  Users,
} from "lucide-react";
// import WidgetStudioButton from "./widget-studio-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_THEME_OPTIONS, AIThemeColor } from "@/lib/ai-theme";


// Using AgentMessage from types/agents.ts instead of local Message interface



interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization' | 'learning';
  title: string;
  message: string;
  confidence: number;
  actionable: boolean;
}

// Using agent types from the centralized agent system

// Available AI voice options for OpenAI TTS
const VOICE_OPTIONS = [
  { value: 'alloy', name: 'Alloy', description: 'Balanced and versatile' },
  { value: 'echo', name: 'Echo', description: 'Clear and articulate' },
  { value: 'fable', name: 'Fable', description: 'Warm and engaging' },
  { value: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { value: 'nova', name: 'Nova', description: 'Bright and energetic' },
  { value: 'shimmer', name: 'Shimmer', description: 'Gentle and soothing' }
];

// Using agents from centralized config instead of local definitions

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

// Using new AgentSelector component instead of old AIAgentSwitcher

function RecommendationCard({ 
  recommendation, 
  onExecute, 
  onViewDetails 
}: { 
  recommendation: any; // Using any for now, will be updated to use agent recommendations
  onExecute: (rec: any) => void;
  onViewDetails: (rec: any) => void;
}) {
  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-600';
    if (impact === 'medium') return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <Card className="mb-3 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm mb-1">{recommendation.title}</h4>
          <div className="flex items-center space-x-2 text-xs">
            <span className={`font-medium ${getImpactColor(recommendation.impact)}`}>
              {recommendation.impact?.toUpperCase()}
            </span>
            <span className="text-blue-600">{recommendation.confidence}%</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{recommendation.description}</p>
        
        {recommendation.metrics && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span className="flex items-center">
              <Target className="h-3 w-3 mr-1" />
              {recommendation.metrics.improvement}
            </span>
            <span className="flex items-center">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              {recommendation.metrics.unit}
            </span>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 h-8 text-xs"
            onClick={() => onExecute(recommendation)}
          >
            <Play className="h-3 w-3 mr-1" />
            Execute
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-8 text-xs"
            onClick={() => onViewDetails(recommendation)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MaxSidebarProps {
  onClose?: () => void;
}

export function MaxSidebar({ onClose }: MaxSidebarProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { isKeyboardOpen, handleInputFocus, handleInputBlur } = useMobileKeyboard();
  const { 
    isMaxOpen,
    setMaxOpen, 
    isMobile, 
    mobileLayoutMode, 
    currentFullscreenView, 
    isCanvasVisible,
    canvasItems,
    setMobileLayoutMode, 
    setCurrentFullscreenView,
    setCanvasVisible,
    setCanvasItems
  } = useMaxDock();
  const { getThemeClasses } = useAITheme();
  const themeClasses = getThemeClasses();
  const { startTour } = useTour();
  const { handleNavigation } = useSplitScreen();
  
  // Agent System Integration
  const { 
    currentAgent, 
    messages, 
    addMessage, 
    clearMessages,
    currentAnalysis,
    switchToAgent,
    availableAgents
  } = useAgent();
  const { analysis, isLoading: isAnalysisLoading } = useAgentAnalysis();
  
  // State management
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [unifiedMode, setUnifiedMode] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Record<string, AgentMessage[]>>({ max: [] });

  // Using new agent analysis system instead of old recommendation generation

  // Handle recommendation actions using new agent system
  const handleExecuteRecommendation = (recommendation: any) => {
    console.log('Executing recommendation:', recommendation);
    toast({
      title: "Executing Action",
      description: `Starting ${recommendation.title}...`,
    });
  };

  const handleViewRecommendationDetails = (recommendation: any) => {
    console.log('Viewing details for:', recommendation);
    toast({
      title: "Recommendation Details",
      description: `Reasoning: ${recommendation.reasoning}`,
    });
  };
  
  // Save voice settings to database only
  useEffect(() => {
    if (user?.id) {
      const saveVoicePreference = async () => {
        try {
          await apiRequest('PATCH', `/api/user-preferences/${user.id}`, {
            maxVoiceEnabled: isVoiceEnabled
          });
        } catch (error) {
          console.error('Failed to save voice preference:', error);
        }
      };
      saveVoicePreference();
    }
  }, [isVoiceEnabled, user?.id]);
  
  useEffect(() => {
    if (user?.id) {
      const saveVoicePreference = async () => {
        try {
          await apiRequest('PATCH', `/api/user-preferences/${user.id}`, {
            maxSelectedVoice: selectedVoice
          });
        } catch (error) {
          console.error('Failed to save voice preference:', error);
        }
      };
      saveVoicePreference();
    }
  }, [selectedVoice, user?.id]);
  
  // Load user preferences when user logs in
  useEffect(() => {
    if (user?.id) {
      const loadUserVoicePreferences = async () => {
        try {
          const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
          const preferences = await response.json();
          
          if (preferences.maxVoiceEnabled !== undefined) {
            setIsVoiceEnabled(preferences.maxVoiceEnabled);
          }
          if (preferences.maxSelectedVoice) {
            setSelectedVoice(preferences.maxSelectedVoice);
          }
        } catch (error) {
          console.error('Failed to load voice preferences:', error);
          // Use default values (already set in state initialization)
        }
      };
      loadUserVoicePreferences();
    }
  }, [user?.id]);
  
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
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize MediaRecorder for Whisper transcription
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    console.log('Initializing Whisper-based speech recognition...');
    // Whisper transcription is server-based, no browser initialization needed
  }, []);

  // Add global keyboard shortcut (Cmd/Ctrl+K) to open Max
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault(); // Prevent default browser behavior
        setMaxOpen(true);
        // Focus the input field after a short delay to ensure the panel is open
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
      // Add Escape key to close Max
      if (event.key === 'Escape' && isMaxOpen) {
        setMaxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMaxOpen, setMaxOpen]);

  // Add global unhandled rejection handler to debug the issue
  useEffect(() => {
    const handleUnhandledRejection = (event: any) => {
      console.error('CAUGHT UNHANDLED PROMISE REJECTION:', event.reason);
      console.error('Promise:', event.promise);
      console.error('Stack trace:', event.reason?.stack);
      
      // Check if it's related to canvas or HTTP requests
      if (event.reason?.message?.includes('Method') || event.reason?.message?.includes('HTTP') || event.reason?.message?.includes('token')) {
        console.error('*** THIS IS THE CANVAS HTTP ERROR WE ARE INVESTIGATING ***:', event.reason);
      }
      
      // Prevent the unhandled rejection from being thrown
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Services
  // const schedulerContextService = SchedulerContextService.getInstance();
  const [schedulerContext, setSchedulerContext] = useState<any>(null);
  
  // Generate page insights and capture scheduler context
  useEffect(() => {
    const currentPage = window.location.pathname;
    generatePageInsights(currentPage);
    
    // Capture scheduler context if on scheduler page
    if (currentPage === '/production-scheduler') {
      // Scheduler context integration disabled for now
      // const context = schedulerContextService.getContext();
      // setSchedulerContext(context);
      setSchedulerContext(null);
    } else {
      setSchedulerContext(null);
    }
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
      case '/production-scheduler':
        // Generate scheduler-specific insights
        if (schedulerContext) {
          if (schedulerContext.events.conflicts.length > 0) {
            insights.push({
              type: 'warning',
              title: 'Scheduling Conflicts',
              message: `${schedulerContext.events.conflicts.length} scheduling conflicts detected. Would you like me to help resolve them?`,
              confidence: 1.0,
              actionable: true
            });
          }
          
          if (schedulerContext.metrics.resourceUtilization > 90) {
            insights.push({
              type: 'optimization',
              title: 'Resource Overload',
              message: `Resources are at ${Math.round(schedulerContext.metrics.resourceUtilization)}% utilization. Consider resource leveling.`,
              confidence: 0.95,
              actionable: true
            });
          }
          
          if (schedulerContext.events.overdue > 0) {
            insights.push({
              type: 'warning',
              title: 'Overdue Operations',
              message: `${schedulerContext.events.overdue} operations are overdue. Need help prioritizing?`,
              confidence: 1.0,
              actionable: true
            });
          }
          
          if (schedulerContext.dependencies.violated > 0) {
            insights.push({
              type: 'warning',
              title: 'Dependency Issues',
              message: `${schedulerContext.dependencies.violated} dependency violations found. Should I analyze the critical path?`,
              confidence: 0.9,
              actionable: true
            });
          }
        }
        break;
    }
    
    setCurrentInsights(insights);
  };

  // Enhanced context capture function
  const captureEnhancedContext = () => {
    // Capture viewport and screen information
    const viewport = {
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Detect device type
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const device = isMobileDevice ? 'mobile' : window.innerWidth < 768 ? 'tablet' : 'desktop';
    
    // Capture selected text if any
    const selectedText = window.getSelection()?.toString();
    
    // Capture active filters and search from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const activeFilters: Record<string, any> = {};
    urlParams.forEach((value, key) => {
      activeFilters[key] = value;
    });
    
    // Get theme preference
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Include scheduler context if available
    const baseContext = {
      viewState: {
        activeFilters,
        selectedText,
        searchQuery: urlParams.get('search') || '',
        viewport
      },
      environmentInfo: {
        device,
        screenSize: { width: window.screen.width, height: window.screen.height },
        browser: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isDarkMode
      },
      sessionMetrics: {
        sessionDuration: Date.now() - (window as any).sessionStartTime || 0,
        lastActivity: new Date()
      }
    };
    
    // Add scheduler context if on scheduler page
    if (window.location.pathname === '/production-scheduler' && schedulerContext) {
      return {
        ...baseContext,
        schedulerContext: {
          currentView: schedulerContext.currentView,
          dateRange: schedulerContext.dateRange,
          resourceUtilization: schedulerContext.metrics.resourceUtilization,
          scheduleCompliance: schedulerContext.metrics.scheduleCompliance,
          totalEvents: schedulerContext.events.total,
          pendingEvents: schedulerContext.events.pending,
          conflicts: schedulerContext.events.conflicts,
          selectedEvent: schedulerContext.selectedEvent,
          selectedResource: schedulerContext.selectedResource,
          criticalResources: schedulerContext.resources.criticalResources
          // suggestions: schedulerContextService.getSuggestions()
        }
      };
    }
    
    return baseContext;
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (params: { message: string; agentId?: string }) => {
      const enhancedContext = captureEnhancedContext();
      const { message, agentId = currentAgent.id } = params;
      
      // All agents use the unified chat endpoint
      const endpoint = '/api/ai-agent/chat';
      
      const response = await apiRequest('POST', endpoint, {
        message,
        agentId: unifiedMode ? undefined : agentId, // In unified mode, let backend decide
        context: {
          page: window.location.pathname,
          user: user?.roles?.[0]?.name || user?.username,
          timestamp: new Date().toISOString(),
          unifiedMode,
          ...enhancedContext
        }
      });
      return { ...await response.json(), agentId };
    },
    onSuccess: (response: any) => {
      // Debug the response to track the issue
      console.log('=== FRONTEND MESSAGE DEBUG ===');
      console.log('Response from agent:', response.agentId);
      console.log('Response message preview:', response.message.substring(0, 200));
      console.log('================================');
      
      // Get the agent that responded
      const respondingAgent = availableAgents.find(a => a.id === response.agentId) || currentAgent;
      
      const assistantMessage: AgentMessage = {
        id: Date.now().toString() + '_assistant',
        type: 'agent',
        agentId: response.agentId,
        content: response.message,
        timestamp: new Date(),
        context: {
          page: window.location.pathname,
          agentName: respondingAgent.displayName,
          agentColor: respondingAgent.color
        },
        reasoning: response.reasoning,
        playbooksUsed: response.playbooksUsed,
        canvasAction: response.canvasAction
      };
      
      // In unified mode, store messages per agent
      if (unifiedMode) {
        setAgentMessages(prev => ({
          ...prev,
          [response.agentId]: [...(prev[response.agentId] || []), assistantMessage]
        }));
      }
      
      addMessage(assistantMessage);

      // Handle canvas actions
      console.log('AI Response received:', response);
      if (response.canvasAction) {
        console.log('Canvas action detected:', response.canvasAction);
        handleCanvasAction(response.canvasAction);
      } else {
        console.log('No canvas action in response');
      }

      // Handle frontend actions
      if (response.frontendAction) {
        console.log('Frontend action detected:', response.frontendAction);
        handleFrontendAction(response.frontendAction);
      }

      // Handle navigation actions
      console.log('Checking for navigation actions in response:', response.data);
      if (response.data?.path && response.data?.action) {
        console.log('Navigation action detected:', response.data);
        handleNavigationAction(response.data);
      } else if (response.actions?.includes('NAVIGATE_TO_PAGE') || response.actions?.includes('OPEN_GANTT_CHART')) {
        console.log('Navigation action in actions array:', response.actions, 'data:', response.data);
        if (response.data?.path) {
          handleNavigationAction(response.data);
        }
      } else {
        console.log('No navigation action found - data:', response.data, 'actions:', response.actions);
      }

      // Play AI response if voice is enabled
      if (isVoiceEnabled && response.message) {
        playTTSResponse(response.message);
      }
    },
    onError: (error: any) => {
      // Instead of showing error toast, display helpful message in chat
      const errorMessage: AgentMessage = {
        id: Date.now().toString() + '_error',
        type: 'system',
        content: "I apologize, but I'm unable to help with that request right now. This might be because:\n\n• The request requires capabilities I don't currently have\n• There's a temporary connectivity issue\n• The request involves sensitive operations I cannot perform\n\nPlease try rephrasing your request or ask me about something else I can help with, like analyzing your production data, optimizing schedules, or explaining system features.",
        timestamp: new Date(),
        context: {
          page: window.location.pathname,
          action: 'error_response'
        }
      };
      addMessage(errorMessage);

      // Play error response if voice is enabled
      if (isVoiceEnabled) {
        playTTSResponse("I'm sorry, but I'm unable to help with that request right now. Please try asking me something else.");
      }
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString() + '_user',
      type: 'user',
      agentId: currentAgent.id,
      content: inputMessage.trim(),
      timestamp: new Date(),
      context: {
        page: window.location.pathname,
        targetAgent: unifiedMode ? 'all' : currentAgent.id
      }
    };

    addMessage(userMessage);
    setInputMessage("");
    
    if (unifiedMode) {
      // In unified mode, send to multiple agents
      const customerFacingAgents = availableAgents.filter(a => 
        a.id === 'max' || a.id === 'production_scheduling'
      );
      
      // Send to each customer-facing agent
      customerFacingAgents.forEach(agent => {
        sendMessageMutation.mutate({ 
          message: inputMessage.trim(), 
          agentId: agent.id 
        });
      });
    } else {
      // Single agent mode
      sendMessageMutation.mutate({ 
        message: inputMessage.trim(), 
        agentId: currentAgent.id 
      });
    }
  };

  const startListening = async () => {
    try {
      console.log('Starting Whisper-based recording...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clear previous audio chunks
      audioChunks.current = [];
      
      // Create new MediaRecorder with fallback format support
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }
      
      console.log('Using MediaRecorder MIME type:', mimeType);
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      // Set up periodic audio processing for streaming transcription
      let intervalId: NodeJS.Timeout | null = null;
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        console.log('Recording stopped, transcribing with Whisper...');
        setIsListening(false);
        
        // Clean up interval
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        
        // Re-enable input for typing (remove readonly)
        if (inputRef.current) {
          inputRef.current.removeAttribute('readonly');
        }
        
        // Check if we have valid audio data
        if (audioChunks.current.length === 0) {
          console.error('No audio data recorded');
          showVoiceError("No audio was recorded. Please try speaking again.");
          return;
        }
        
        // Create blob from recorded chunks (use the same mimeType as MediaRecorder)
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        console.log('Audio blob created:', audioBlob.size, 'bytes, type:', mimeType);
        
        // Check if audio blob is empty or too small
        if (audioBlob.size < 1000) {
          console.error('Audio blob too small:', audioBlob.size, 'bytes');
          showVoiceError("Recording too short. Please speak for at least 1-2 seconds.");
          return;
        }
        
        // Send to Whisper API for transcription
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        try {
          console.log('Sending audio to Whisper API...');
          const response = await fetch('/api/ai-agent/transcribe', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
            },
            body: formData
          });
          
          console.log('Whisper API response status:', response.status);
          const result = await response.json();
          console.log('Whisper API result:', result);
          
          if (result.success && result.text) {
            console.log('Transcription successful:', result.text);
            // Add transcribed text to input, removing any interim "..." markers
            const baseMessage = inputMessage.replace(/\.\.\.$/, '').trim();
            setInputMessage(baseMessage ? `${baseMessage} ${result.text}` : result.text);
            
            // Focus input and position cursor at end after transcription
            if (inputRef.current) {
              inputRef.current.focus();
              const newMessage = baseMessage ? `${baseMessage} ${result.text}` : result.text;
              inputRef.current.setSelectionRange(newMessage.length, newMessage.length);
            }
          } else {
            console.error('Transcription failed:', result);
            showVoiceError(`Transcription failed: ${result.error || "Couldn't understand what you said"}. Please try again.`);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          showVoiceError("Network error during transcription. Please check your connection and try again.");
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with timeslice for periodic data
      mediaRecorder.current.start(3000); // Get data every 3 seconds for streaming
      setIsListening(true);
      console.log('Recording started with Whisper transcription');
      
      // Set up periodic transcription for streaming feedback
      intervalId = setInterval(async () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording' && audioChunks.current.length > 0) {
          // Create interim transcription from current chunks
          const tempChunks = [...audioChunks.current];
          if (tempChunks.length > 0) {
            try {
              const mimeType = mediaRecorder.current.mimeType || 'audio/webm';
              const tempBlob = new Blob(tempChunks, { type: mimeType });
              
              if (tempBlob.size >= 5000) { // Only process if we have enough data
                const formData = new FormData();
                formData.append('audio', tempBlob, 'interim.webm');
                
                const response = await fetch('/api/ai-agent/transcribe', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                  },
                  body: formData
                });
                
                const result = await response.json();
                if (result.success && result.text) {
                  // Update input with interim transcription
                  const baseMessage = inputMessage.split('...')[0].trim(); // Remove previous interim text
                  setInputMessage(baseMessage ? `${baseMessage} ${result.text}...` : `${result.text}...`);
                  
                  // Update cursor position
                  if (inputRef.current) {
                    const newMessage = baseMessage ? `${baseMessage} ${result.text}...` : `${result.text}...`;
                    inputRef.current.setSelectionRange(newMessage.length, newMessage.length);
                  }
                }
              }
            } catch (error) {
              console.log('Interim transcription failed, continuing...', error);
            }
          }
        }
      }, 3000);
      
      // Focus input without triggering keyboard on mobile
      if (inputRef.current) {
        inputRef.current.setAttribute('readonly', 'true');
        inputRef.current.focus();
        inputRef.current.setSelectionRange(inputMessage.length, inputMessage.length);
      }
      
    } catch (error) {
      console.error('Microphone access error:', error);
      setIsListening(false);
      
      if ((error as any).name === 'NotAllowedError') {
        toast({
          title: "Microphone Permission Needed",
          description: "Please allow microphone access to use voice input",
          variant: "destructive"
        });
      } else {
        showVoiceError("Unable to access microphone. Please check your device settings.");
      }
    }
  };

  // Helper function to show voice errors in chat
  const showVoiceError = (message: string) => {
    const errorMessage: Message = {
      id: Date.now().toString() + '_voice_error',
      type: 'assistant',
      content: message,
      timestamp: new Date(),
      context: {
        page: window.location.pathname,
        action: 'voice_error'
      }
    };
    setMessages(prev => [...prev, errorMessage]);
  };



  const stopListening = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      console.log('Stopping Whisper recording...');
      mediaRecorder.current.stop();
    }
    
    // Ensure input is always re-enabled when stopping
    if (inputRef.current) {
      inputRef.current.removeAttribute('readonly');
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const playTTSResponse = async (text: string) => {
    // Only play TTS if voice output is enabled
    if (!isVoiceEnabled) {
      return;
    }
    
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

  // Function to save canvas content to database
  const saveCanvasContentToDatabase = async (canvasItem: CanvasItem, sessionId: string) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token available for canvas persistence');
        return;
      }

      const canvasContentData = {
        sessionId,
        itemData: canvasItem
      };

      const response = await fetch('/api/canvas/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(canvasContentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Canvas content persisted to database:', result);
    } catch (error) {
      console.error('Failed to save canvas content to database:', error);
      throw error;
    }
  };

  const handleCanvasAction = (canvasAction: any) => {
    console.log('handleCanvasAction called with:', canvasAction);
    if (!canvasAction) {
      console.log('No canvas action provided');
      return;
    }
    
    console.log('Processing canvas action type:', canvasAction.type);
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
            content: canvasAction.content.type === 'chart' ? canvasAction.content : (canvasAction.content.data || canvasAction.content),
            width: canvasAction.content.width || '100%',
            height: canvasAction.content.height || 'auto',
            timestamp: canvasAction.content.timestamp || new Date().toISOString()
          };
          console.log('Creating new canvas item:', newItem);
          setCanvasItems(prev => {
            const newItems = [newItem, ...prev];
            console.log('Setting canvas items to:', newItems);
            return newItems;
          }); // Add to top
          console.log('Setting canvas visible to true');
          setCanvasVisible(true); // Auto-show canvas when content is added
          console.log('Canvas visibility state after setting:', isCanvasVisible);

          // Persist canvas content to database (background, non-blocking)
          const sessionId = `session_${Date.now()}`;
          try {
            saveCanvasContentToDatabase(newItem, sessionId).catch(error => {
              console.warn('Failed to persist canvas content to database:', error);
              // Don't show error to user as canvas still works with frontend state
            });
          } catch (syncError) {
            console.warn('Synchronous error in canvas persistence:', syncError);
          }
        }
        break;
      case 'CLEAR_AND_ADD_CANVAS_CONTENT':
        // First clear existing canvas items
        setCanvasItems([]);
        
        // Then add new content
        if (canvasAction.content) {
          const newItem: CanvasItem = {
            id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: canvasAction.content.type || 'custom',
            title: canvasAction.content.title || 'AI Generated Content',
            content: canvasAction.content.type === 'chart' ? canvasAction.content : (canvasAction.content.data || canvasAction.content),
            width: canvasAction.content.width || '100%',
            height: canvasAction.content.height || 'auto',
            timestamp: canvasAction.content.timestamp || new Date().toISOString()
          };
          console.log('Creating new canvas item after clearing:', newItem);
          setCanvasItems([newItem]); // Replace with new item only
          setCanvasVisible(true); // Auto-show canvas when content is added

          // Persist canvas content to database (background, non-blocking)
          const sessionId = `session_${Date.now()}`;
          try {
            saveCanvasContentToDatabase(newItem, sessionId).catch(error => {
              console.warn('Failed to persist canvas content to database:', error);
            });
          } catch (syncError) {
            console.warn('Synchronous error in canvas persistence:', syncError);
          }
        }
        break;
    }
  };

  const toggleCanvas = () => {
    try {
      console.log('Canvas toggle clicked, current state:', isCanvasVisible);
      
      // Mark the toggle time to prevent navigation interference
      (window as any).lastCanvasToggleTime = Date.now();
      
      setCanvasVisible(!isCanvasVisible);
      console.log('Canvas toggle completed, new state should be:', !isCanvasVisible);
    } catch (error) {
      console.error('Error toggling canvas:', error);
      toast({
        title: "Canvas Error",
        description: "Unable to toggle canvas display",
        variant: "destructive"
      });
    }
  };

  const handleNavigationAction = (navigationData: any) => {
    console.log('Processing navigation action:', navigationData);
    
    try {
      // Handle navigation based on the data structure
      if (navigationData.page && navigationData.path) {
        // Modern navigation with page and path - check permissions if required
        const { page, path, name, requiredPermissions = [] } = navigationData;
        
        // For now, allow all navigation (permission checking can be enhanced later)
        if (requiredPermissions.length > 0) {
          console.log(`Navigation to ${name} requires permissions:`, requiredPermissions);
        }
        
        console.log('Navigating to:', path);
        handleNavigation(path, name || page);
        
        // Add buffer to prevent navigation conflicts
        setTimeout(() => {
          (window as any).lastNavigationTime = Date.now();
        }, 500);
        
        console.log(`Navigated to ${name || page} (${path})`);
        
        // Show success message for permissions-required pages
        toast({
          title: "Navigation Successful",
          description: `Opened ${name || page}`,
        });
      } else if (navigationData.path) {
        // Simple navigation with path only
        console.log('Navigating to:', navigationData.path);
        handleNavigation(navigationData.path, navigationData.page || 'page');
        
        // Give user feedback about navigation
        toast({
          title: "Navigation",
          description: `Opened ${navigationData.page || 'page'}`,
        });
      } else if (navigationData.route) {
        // Legacy navigation with route
        const targetPath = navigationData.route.startsWith('/') ? navigationData.route : `/${navigationData.route}`;
        handleNavigation(targetPath, navigationData.page || 'page');
        
        console.log(`Navigated to ${targetPath}`);
        toast({
          title: "Navigation",
          description: `Opened ${navigationData.page || 'page'}`,
        });
      } else {
        console.warn('Unknown navigation data structure:', navigationData);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Unable to navigate to the requested page",
        variant: "destructive"
      });
    }
  };

  const handleFrontendAction = (frontendAction: any) => {
    console.log('Processing frontend action:', frontendAction);
    
    try {
      // Validate frontend action structure
      if (!frontendAction || !frontendAction.type) {
        console.error('Invalid frontend action structure:', frontendAction);
        toast({
          title: "Action Error",
          description: "Invalid action format received",
          variant: "destructive"
        });
        return;
      }
      
      switch (frontendAction.type) {
        case 'START_TOUR':
          const { roleId, voiceEnabled, context } = frontendAction.parameters || {};
          console.log('Starting tour with parameters:', { roleId, voiceEnabled, context });
          
          // Validate parameters
          if (!roleId || (typeof roleId !== 'number' && typeof roleId !== 'string')) {
            console.error('Invalid role ID for tour:', roleId);
            toast({
              title: "Tour Error",
              description: "Invalid role specified for tour",
              variant: "destructive"
            });
            return;
          }
          
          // Check if startTour function is available
          if (typeof startTour !== 'function') {
            console.error('startTour function not available');
            toast({
              title: "Tour Error",
              description: "Tour system not initialized. Please refresh the page.",
              variant: "destructive"
            });
            return;
          }
          
          try {
            // Call the tour system to start the tour
            startTour(Number(roleId), voiceEnabled, context);
            
            // Show success message
            toast({
              title: "Tour Started",
              description: `Guided tour initiated for role ${roleId} with voice ${voiceEnabled ? 'enabled' : 'disabled'}`,
            });
          } catch (tourError) {
            console.error('Error starting tour:', tourError);
            toast({
              title: "Tour Error",
              description: `Failed to start tour: ${tourError instanceof Error ? tourError.message : 'Unknown error'}`,
              variant: "destructive"
            });
          }
          break;
          
        case 'START_CUSTOM_TOUR':
          const { tourContent, voiceEnabled: customVoiceEnabled, targetRoles } = frontendAction.parameters || {};
          console.log('Starting custom tour with content:', tourContent);
          
          // Validate tour content
          if (!tourContent) {
            console.error('No tour content provided for custom tour');
            toast({
              title: "Tour Error",
              description: "No tour content provided",
              variant: "destructive"
            });
            return;
          }
          
          if (!tourContent.steps || !Array.isArray(tourContent.steps) || tourContent.steps.length === 0) {
            console.error('Invalid or empty tour steps:', tourContent.steps);
            toast({
              title: "Tour Error",
              description: "Tour has no valid steps to display",
              variant: "destructive"
            });
            return;
          }
          
          try {
            // Store the custom tour content temporarily for the tour system to use
            localStorage.setItem('customTourContent', JSON.stringify(tourContent));
            
            // Check if startTour function is available
            if (typeof startTour !== 'function') {
              console.error('startTour function not available for custom tour');
              toast({
                title: "Tour Error",
                description: "Tour system not initialized. Please refresh the page.",
                variant: "destructive"
              });
              return;
            }
            
            // Start the custom tour using the trainer role as default
            startTour(9, customVoiceEnabled, 'custom');
            
            // Show success message
            toast({
              title: "Custom Tour Created & Started",
              description: `"${tourContent.title}" tour created with ${tourContent.steps.length} steps for ${targetRoles?.join(', ') || 'all roles'}`,
            });
          } catch (customTourError) {
            console.error('Error starting custom tour:', customTourError);
            toast({
              title: "Custom Tour Error",
              description: `Failed to start custom tour: ${customTourError instanceof Error ? customTourError.message : 'Unknown error'}`,
              variant: "destructive"
            });
          }
          break;
          
        default:
          console.warn('Unknown frontend action type:', frontendAction.type);
          toast({
            title: "Action Warning",
            description: `Unknown action type: ${frontendAction.type}`,
            variant: "destructive"
          });
          break;
      }
    } catch (error) {
      console.error('Frontend action processing error:', error);
      toast({
        title: "Action Error",
        description: `Unable to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const testVoice = async () => {
    const testText = `Hello! This is the ${VOICE_OPTIONS.find(v => v.value === selectedVoice)?.name} voice.`;
    await playTTSResponse(testText);
  };

  const handleCopyMessage = async (message: AgentMessage) => {
    const copyText = `Max AI Response (${message.timestamp.toLocaleString()}):\n\n${message.content}`;
    
    try {
      await navigator.clipboard.writeText(copyText);
      toast({
        title: "Copied to Clipboard",
        description: "Response copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy response. Please select and copy manually.",
        variant: "destructive"
      });
    }
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
    <div className={`h-full flex flex-col bg-white ${isKeyboardOpen ? 'keyboard-adjusted' : ''}`}>
      {/* Agent Selector Bar - Very Prominent */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-3 border-b-2 border-white">
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="default" 
                className="flex-1 bg-white text-purple-700 hover:bg-purple-50 font-semibold"
              >
                <Sparkles className="h-4 w-4 mr-2 text-purple-700" />
                <span className="font-semibold text-purple-700">{currentAgent.displayName}</span>
                <ChevronDown className="h-4 w-4 ml-auto text-purple-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Choose Your AI Assistant</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => switchToAgent('max')}
                className={currentAgent.id === 'max' ? 'bg-purple-100' : ''}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" style={{ color: '#8B5CF6' }} />
                  <div>
                    <div className="font-semibold">Max AI Assistant</div>
                    <div className="text-xs text-gray-500">General production assistant</div>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => switchToAgent('production_scheduling')}
                className={currentAgent.id === 'production_scheduling' ? 'bg-emerald-100' : ''}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" style={{ color: '#10B981' }} />
                  <div>
                    <div className="font-semibold">Production Scheduling Agent</div>
                    <div className="text-xs text-gray-500">APS & scheduling optimization expert</div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Toggle
            pressed={unifiedMode}
            onPressedChange={setUnifiedMode}
            size="default"
            className="bg-white text-purple-700 hover:bg-purple-50 data-[state=on]:bg-purple-100"
          >
            <Users className="h-4 w-4 mr-2" />
            Unified
          </Toggle>
        </div>
      </div>
      
      {/* Single Consolidated Header */}
      <div 
        className={`p-4 ${unifiedMode ? 'bg-gradient-to-r from-purple-600 to-cyan-600' : getThemeClasses(false)} flex flex-col gap-3 cursor-move`}
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        style={{ touchAction: 'none' }}
      >
        {/* First row: Title and close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unifiedMode ? (
              <>
                <Users className="h-5 w-5 text-white" />
                <h2 className="text-white text-sm font-medium">Unified Agent Mode</h2>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-white" />
                <h2 className="text-white text-sm font-medium">AI Assistant</h2>
              </>
            )}
          </div>
          <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoiceOutput}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            title={isVoiceEnabled ? "Disable voice responses" : "Enable voice responses"}
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
            className={`h-6 w-6 p-0 text-white hover:bg-white/20 ${isCanvasVisible ? 'bg-white/20' : ''}`}
            title={`${isCanvasVisible ? 'Hide' : 'Show'} Canvas`}
          >
            <Monitor className="h-3 w-3" />
          </Button>
          
          {/* Mobile Layout Switcher - Only show on mobile */}
          {isMobile && mobileLayoutMode === 'fullscreen' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFullscreenView(currentFullscreenView === 'main' ? 'max' : 'main')}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                title={`Switch to ${currentFullscreenView === 'main' ? 'Max' : 'Main Content'} View`}
              >
                {currentFullscreenView === 'main' ? <Sparkles className="h-3 w-3 text-white" /> : <MessageSquare className="h-3 w-3" />}
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                setMaxOpen(false);
              }
            }}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            title="Close Max"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        </div>
        </div>

      {/* Consolidated Settings Panel - Only when needed */}
      {(showVoiceSettings || currentInsights.length > 0 || schedulerContext) && (
        <div className="p-3 bg-gray-50 border-b">
          {/* Voice Settings - Compact */}
          {showVoiceSettings && (
            <div className="space-y-2 mb-3">
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={testVoice} className="flex-1 h-7 text-xs">
                  Test Voice
                </Button>
                <AIThemeSelector />
              </div>
            </div>
          )}

          {/* Scheduler Context Display - When on Scheduler Pro page */}
          {schedulerContext && window.location.pathname === '/production-scheduler' && (
            <div className="space-y-2 mb-3">
              <div className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Scheduler Status
              </div>
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Operations</span>
                    <span className="font-medium">{schedulerContext.events.total}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {schedulerContext.events.inProgress} in progress, {schedulerContext.events.pending} pending
                  </div>
                </div>
                
                <div className="bg-white p-2 rounded border">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Resources</span>
                    <span className="font-medium">{Math.round(schedulerContext.metrics.resourceUtilization)}%</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {schedulerContext.resources.total} total resources
                  </div>
                </div>
              </div>

              {/* Critical Issues */}
              {(schedulerContext.events.conflicts.length > 0 || 
                schedulerContext.events.overdue > 0 || 
                schedulerContext.dependencies.violated > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Issues Detected</span>
                  </div>
                  <div className="space-y-1 text-[10px] text-yellow-700">
                    {schedulerContext.events.conflicts.length > 0 && (
                      <div>• {schedulerContext.events.conflicts.length} scheduling conflicts</div>
                    )}
                    {schedulerContext.events.overdue > 0 && (
                      <div>• {schedulerContext.events.overdue} overdue operations</div>
                    )}
                    {schedulerContext.dependencies.violated > 0 && (
                      <div>• {schedulerContext.dependencies.violated} dependency violations</div>
                    )}
                  </div>
                </div>
              )}

              {/* Scheduling Algorithms Quick Actions */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Scheduling Algorithms
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={async () => {
                      // const result = await schedulerContextService.executeSchedulingAlgorithm('ASAP');
                      const result = { success: false, message: 'Scheduler service not available' };
                      toast({
                        title: result.success ? "ASAP Algorithm Applied" : "Algorithm Failed",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                    className="text-[10px] p-1.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border rounded transition-colors flex items-center gap-1"
                  >
                    <TrendingUp className="h-3 w-3" />
                    ASAP
                  </button>
                  <button
                    onClick={async () => {
                      // const result = await schedulerContextService.executeSchedulingAlgorithm('ALAP');
                      const result = { success: false, message: 'Scheduler service not available' };
                      toast({
                        title: result.success ? "ALAP Algorithm Applied" : "Algorithm Failed",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                    className="text-[10px] p-1.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border rounded transition-colors flex items-center gap-1"
                  >
                    <TrendingDown className="h-3 w-3" />
                    ALAP
                  </button>
                  <button
                    onClick={async () => {
                      // const result = await schedulerContextService.executeSchedulingAlgorithm('CRITICAL_PATH');
                      const result = { success: false, message: 'Scheduler service not available' };
                      toast({
                        title: result.success ? "Critical Path Applied" : "Algorithm Failed",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                    className="text-[10px] p-1.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border rounded transition-colors flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Critical Path
                  </button>
                  <button
                    onClick={async () => {
                      // const result = await schedulerContextService.executeSchedulingAlgorithm('LEVEL_RESOURCES');
                      const result = { success: false, message: 'Scheduler service not available' };
                      toast({
                        title: result.success ? "Resources Leveled" : "Algorithm Failed",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                    className="text-[10px] p-1.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border rounded transition-colors flex items-center gap-1"
                  >
                    <BarChart3 className="h-3 w-3" />
                    Level Resources
                  </button>
                  <button
                    onClick={async () => {
                      // const result = await schedulerContextService.executeSchedulingAlgorithm('DRUM_TOC');
                      const result = { success: false, message: 'Scheduler service not available' };
                      toast({
                        title: result.success ? "TOC Applied" : "Algorithm Failed",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                    className="text-[10px] p-1.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border rounded transition-colors flex items-center gap-1 col-span-2"
                  >
                    <Target className="h-3 w-3" />
                    Drum (Theory of Constraints)
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage("Analyze the current schedule");
                      handleSendMessage();
                    }}
                    className="text-[10px] p-1.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border rounded transition-colors flex items-center gap-1 col-span-2"
                  >
                    <Zap className="h-3 w-3" />
                    Analyze Schedule
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              {schedulerContext.suggestions && schedulerContext.suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-gray-600">Suggested Actions:</div>
                  {schedulerContext.suggestions.slice(0, 3).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputMessage(suggestion);
                        handleSendMessage();
                      }}
                      className="w-full text-left text-[10px] p-1.5 bg-white hover:bg-blue-50 border rounded transition-colors"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Smart Insights - Compact */}
          {currentInsights.length > 0 && (
            <div className="space-y-1">
              {currentInsights.map((insight, index) => (
                <div 
                  key={index}
                  className="text-xs bg-white p-2 rounded border cursor-pointer hover:bg-gray-50"
                  onClick={() => handleInsightAction(insight)}
                >
                  <div className="flex items-center gap-1">
                    {insight.type === 'suggestion' && <Lightbulb className="h-3 w-3 text-yellow-500" />}
                    {insight.type === 'warning' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    {insight.type === 'optimization' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {insight.type === 'learning' && <Sparkles className="h-3 w-3 text-purple-500" />}
                    <span className="font-medium">{insight.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Input - At the top before messages */}
      {isMobile && (
        <div className="p-3 border-b bg-gray-50 mobile-input-fixed mobile-input-container">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? "Listening... speak now" : "Ask me anything about your operations..."}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className={`text-sm ${isListening ? 'border-green-300 bg-green-50 pl-8' : ''} mobile-input`}
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              {isListening && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-green-600">
                  <Mic className="h-3 w-3 animate-pulse" />
                  <span className="animate-pulse">●</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMicrophone}
                className={`px-2 transition-colors ${
                  isListening 
                    ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                    : 'hover:bg-gray-100'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <Mic className="h-3.5 w-3.5 text-green-600 animate-pulse" />
                ) : (
                  <Mic className="h-3.5 w-3.5 text-gray-500" />
                )}
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
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {/* Agent Selector - Simple and Visible */}
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-700">Select AI Agent:</span>
              <Toggle
                pressed={unifiedMode}
                onPressedChange={setUnifiedMode}
                size="sm"
                className="data-[state=on]:bg-purple-600"
              >
                <Users className="h-3 w-3 mr-1" />
                <span className="text-xs">Unified Mode</span>
              </Toggle>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => switchToAgent('max')}
                className={`text-left p-2 rounded flex items-center gap-2 transition-colors ${
                  currentAgent.id === 'max' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white hover:bg-purple-100 text-gray-700'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Max AI Assistant</div>
                  <div className="text-xs opacity-75">General production assistant</div>
                </div>
              </button>
              <button
                onClick={() => switchToAgent('production_scheduling')}
                className={`text-left p-2 rounded flex items-center gap-2 transition-colors ${
                  currentAgent.id === 'production_scheduling' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white hover:bg-emerald-100 text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Production Scheduling Agent</div>
                  <div className="text-xs opacity-75">APS & scheduling optimization expert</div>
                </div>
              </button>
            </div>
            {unifiedMode && (
              <div className="mt-2 text-xs text-purple-600 text-center">
                All agents are active - Messages will be routed to the best match
              </div>
            )}
          </div>

          {/* Agent Recommendations */}
          {showRecommendations && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: currentAgent.color }} />
                  {currentAgent.displayName} Insights
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${showRecommendations ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {isAnalysisLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <span className="ml-2 text-sm text-muted-foreground">Analyzing operations...</span>
                </div>
              ) : analysis?.recommendations && analysis.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {analysis.recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onExecute={handleExecuteRecommendation}
                      onViewDetails={handleViewRecommendationDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  <Target className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>No insights available</p>
                  <p className="text-xs">Check back for {currentAgent.displayName} analysis</p>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Chat with {currentAgent.displayName}</span>
            </div>
            
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                <Bot className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p>Start a conversation with {currentAgent.displayName}</p>
                <p className="text-xs mt-1">{currentAgent.description}</p>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {currentAgent.specialties.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-2 text-sm relative group whitespace-normal break-words ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white rounded-lg'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white rounded-3xl'
                }`}
              >
                {message.content}
                {message.type === 'assistant' && (message.reasoning || message.playbooksUsed) && (
                  <AIReasoning 
                    reasoning={message.reasoning}
                    playbooksUsed={message.playbooksUsed}
                    onFeedback={(feedback) => {
                      console.log('AI reasoning feedback:', feedback);
                      // Could send feedback to backend here
                    }}
                  />
                )}
                <div className={`text-xs mt-1 opacity-70 flex items-center justify-between`}>
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {message.type === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyMessage(message)}
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                      title="Copy this response"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Show AI reasoning for assistant messages */}
              {message.type === 'assistant' && (message.reasoning || message.playbooksUsed) && (
                <div className="mt-2">
                  <AIReasoning
                    reasoning={message.reasoning}
                    playbooksUsed={message.playbooksUsed}
                    onFeedback={(feedback, details) => {
                      // Track feedback for improving AI
                      apiRequest('/api/max-ai/feedback', 'POST', {
                        messageId: message.id,
                        feedback,
                        details
                      }).catch(console.error);
                    }}
                    onEditPlaybook={(playbookId) => {
                      // Navigate to playbook editor
                      window.location.href = `/memory-book?edit=${playbookId}`;
                    }}
                    onCreatePlaybook={(context) => {
                      // Navigate to create new playbook with context
                      window.location.href = `/memory-book?create=true&context=${encodeURIComponent(message.content)}`;
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>



      {/* Input - Desktop version at bottom */}
      {!isMobile && (
        <div className="p-3 border-t bg-gray-50">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? "Listening... speak now" : "Ask me anything about your operations..."}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className={`text-sm ${isListening ? 'border-green-300 bg-green-50 pl-8' : ''}`}
              />
              {isListening && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-green-600">
                  <Mic className="h-3 w-3 animate-pulse" />
                  <span className="animate-pulse">●</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMicrophone}
                className={`px-2 transition-colors ${
                  isListening 
                    ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                    : 'hover:bg-gray-100'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <Mic className="h-3.5 w-3.5 text-green-600 animate-pulse" />
                ) : (
                  <Mic className="h-3.5 w-3.5 text-gray-500" />
                )}
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
      )}

    </div>
  );
}