import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, TrendingUp, Lightbulb, Activity, ChevronLeft, ChevronRight, Play, RefreshCw, MessageSquare, Send, User, GripVertical, Settings, Volume2, VolumeX, Palette, Zap, Shield, Bell, X, Copy, Check, ChevronDown, Square, BookOpen, History, Monitor, Layers, Calendar, Factory, Wrench, Package, Target, Truck, DollarSign, MessageCircle, Paperclip, FileText, Image, File, Mic, MicOff, StopCircle, CheckCircle, Loader2 } from 'lucide-react';
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
import { ALL_AGENTS } from '@/config/agents';
import { useChatSync, type ChatMessage } from '@/hooks/useChatSync';
import { useMaxDock, type CanvasItem } from '@/contexts/MaxDockContext';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useRealtimeVoice } from '@/hooks/use-realtime-voice';
import { useToast } from '@/hooks/use-toast';
// Scheduler context service removed with production-scheduler cleanup

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

// Remove duplicate interface - using the one from useChatSync

interface AILeftPanelProps {
  onClose?: () => void;
}

export function AILeftPanel({ onClose }: AILeftPanelProps) {
  const [, navigate] = useLocation();
  const { handleNavigation } = useSplitScreen();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('ai-panel-collapsed');
    return saved === 'true';
  });
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [floatingNotification, setFloatingNotification] = useState<ChatMessage | null>(null);
  const [showFloatingNotification, setShowFloatingNotification] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // File attachment state
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    content?: string;
    url?: string;
    file: File; // Keep original File for upload
  }>>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimeout, setRecordingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
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
      soundEnabled: true, // Enable voice by default
      contextWindow: 'standard',
      temperature: 0.7,
      maxTokens: 2000,
      streamResponses: true,
      // Voice Settings
      voiceMode: 'hybrid', // 'hybrid' (Web Speech + Whisper) or 'realtime' (OpenAI Realtime API)
      voice: 'nova', // Changed to Nova for better quality
      voiceSpeed: 1.0,
      voiceGender: 'neutral',
      // Theme Settings
      aiThemeColor: 'purple-pink'
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If old settings have soundEnabled: false, reset it to true (enable voice by default)
        if (parsed.soundEnabled === false) {
          console.log('[Voice] Resetting old soundEnabled: false to true');
          parsed.soundEnabled = true;
        }
        settings = { ...settings, ...parsed };
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

  // Fetch available models from OpenAI API
  const [availableModels, setAvailableModels] = useState<Array<{id: string; created: number; owned_by: string}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/ai/models');
        if (response.ok) {
          const data = await response.json();
          if (data.models && data.models.length > 0) {
            setAvailableModels(data.models);
          } else {
            // Use fallback if API returns empty list
            useFallbackModels();
          }
        } else {
          // Use fallback if API returns non-OK response
          console.error('Failed to fetch models: API returned status', response.status);
          useFallbackModels();
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to default models if API fails with network error
        useFallbackModels();
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    const useFallbackModels = () => {
      setAvailableModels([
        { id: 'gpt-4o', created: Date.now() / 1000, owned_by: 'openai' },
        { id: 'gpt-4-turbo', created: Date.now() / 1000, owned_by: 'openai' },
        { id: 'gpt-3.5-turbo', created: Date.now() / 1000, owned_by: 'openai' }
      ]);
    };
    
    fetchModels();
  }, []);

  const { chatMessages, addMessage } = useChatSync();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { canvasItems, setCanvasItems, isCanvasVisible, setCanvasVisible } = useMaxDock();
  const previousMessageCountRef = useRef(0);

  // Initialize Realtime Voice API hook
  const realtimeVoice = useRealtimeVoice({
    agentId: currentAgent?.agentId || 'max',
    voice: aiSettings.voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
    vadMode: 'server_vad',
    pauseDetectionMs: 1500, // 1.5 second pause detection
    onPauseDetected: async (transcript: string) => {
      console.log('🎙️ Pause detected in voice conversation. Sending message:', transcript);
      
      // Add user message to chat immediately
      addMessage({
        role: 'user',
        content: transcript,
        source: 'panel'
      });
      
      // Send message to AI (this will trigger automatic response)
      try {
        await sendMessageMutation.mutateAsync(transcript);
      } catch (error) {
        console.error('Failed to send voice message after pause detection:', error);
      }
    },
    onAction: (action: any) => {
      console.log('[Realtime Voice] Action received:', action);
      // Handle agent actions like navigation, switching agents, etc.
      if (action.type === 'navigate') {
        handleNavigation(action.path, action.title || 'Navigate');
      }
    },
    onError: (error: string) => {
      console.error('[Realtime Voice] Error:', error);
    }
  });
  
  // Scheduler context removed with production-scheduler cleanup
  const [schedulerContext, setSchedulerContext] = useState<any>(null);
  const [schedulerInsights, setSchedulerInsights] = useState<AIInsight[]>([]);

  // Monitor for new messages and show floating notification when collapsed
  useEffect(() => {
    const currentMessageCount = chatMessages.length;
    const previousCount = previousMessageCountRef.current;
    
    // Check if there's a new assistant message
    if (currentMessageCount > previousCount) {
      const newMessages = chatMessages.slice(previousCount);
      const latestAssistantMessage = newMessages.find(msg => msg.role === 'assistant');
      
      // Show floating notification if panel is collapsed AND there's a new assistant message
      if (latestAssistantMessage && isCollapsed) {
        setFloatingNotification(latestAssistantMessage);
        setShowFloatingNotification(true);
        
        // Auto-hide after 10 seconds (increased from 8)
        setTimeout(() => {
          setShowFloatingNotification(false);
          setTimeout(() => setFloatingNotification(null), 300); // Allow fade out
        }, 10000);
      }
      
      // If panel is open and there's a new assistant message, ensure we scroll to it
      if (latestAssistantMessage && !isCollapsed) {
        setTimeout(scrollToBottom, 100);
      }
    }
    
    previousMessageCountRef.current = currentMessageCount;
  }, [chatMessages, isCollapsed]);
  
  // Capture scheduler context when on scheduler page
  useEffect(() => {
    const currentPage = location;
    
    // Generate page-specific insights
    generatePageInsights(currentPage);
    
    // Capture scheduler context if on scheduler page (removed with production-scheduler)
    if (currentPage === '/production-scheduler') {
      // Scheduler context service removed
      setSchedulerContext(null);
      
      // Update context periodically while on scheduler page
      const interval = setInterval(() => {
        // Scheduler context service removed
        setSchedulerContext(null);
        generateSchedulerInsights(null);
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    } else {
      setSchedulerContext(null);
      setSchedulerInsights([]);
    }
  }, [location]);
  
  // Generate scheduler-specific insights
  const generateSchedulerInsights = (context: any) => {
    if (!context) return;
    
    const insights: AIInsight[] = [];
    
    // Check for scheduling conflicts
    if (context.events?.conflicts?.length > 0) {
      insights.push({
        id: 'conflicts-' + Date.now(),
        type: 'conflict',
        title: 'Scheduling Conflicts Detected',
        description: `${context.events.conflicts.length} scheduling conflicts need resolution`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        actionable: true,
        impact: 'Production delays possible',
        recommendation: 'Resolve conflicts to maintain schedule'
      });
    }
    
    // Check resource utilization
    if (context.metrics?.resourceUtilization > 90) {
      insights.push({
        id: 'utilization-' + Date.now(),
        type: 'bottleneck',
        title: 'High Resource Utilization',
        description: `Resources at ${Math.round(context.metrics.resourceUtilization)}% capacity`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        actionable: true,
        impact: 'Limited scheduling flexibility',
        recommendation: 'Consider resource leveling or capacity expansion'
      });
    }
    
    // Check for overdue operations
    if (context.events?.overdue > 0) {
      insights.push({
        id: 'overdue-' + Date.now(),
        type: 'anomaly',
        title: 'Overdue Operations',
        description: `${context.events.overdue} operations are behind schedule`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        actionable: true,
        impact: 'Customer delivery at risk',
        recommendation: 'Prioritize overdue operations'
      });
    }
    
    // Check dependency violations
    if (context.dependencies?.violated > 0) {
      insights.push({
        id: 'dependencies-' + Date.now(),
        type: 'anomaly',
        title: 'Dependency Violations',
        description: `${context.dependencies.violated} dependency constraints violated`,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        actionable: true,
        impact: 'Schedule integrity compromised',
        recommendation: 'Review and fix dependency links'
      });
    }
    
    // Check schedule compliance
    if (context.metrics?.scheduleCompliance < 80) {
      insights.push({
        id: 'compliance-' + Date.now(),
        type: 'optimization',
        title: 'Low Schedule Compliance',
        description: `Schedule compliance at ${Math.round(context.metrics.scheduleCompliance)}%`,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        actionable: true,
        impact: 'Production efficiency reduced',
        recommendation: 'Run optimization to improve compliance'
      });
    }
    
    setSchedulerInsights(insights);
  };
  
  // Generate general page insights
  const generatePageInsights = (page: string) => {
    // This function can be expanded for other pages as needed
    // For now, focusing on scheduler-specific insights
  };

  // Save AI settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Stop current audio playback
  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlaying(false);
    // Also stop browser speech synthesis if active
    window.speechSynthesis.cancel();
  }, [currentAudio]);

  // OpenAI voice synthesis function with enhanced controls
  const speakResponse = useCallback(async (text: string) => {
    if (!aiSettings.soundEnabled || !text.trim()) return;
    
    // Stop any currently playing audio
    stopAudio();
    
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          text: text.substring(0, 4000), // Limit text length for TTS
          voice: aiSettings.voice || 'nova',
          speed: aiSettings.voiceSpeed || 1.0
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Set up audio event listeners
        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          setIsPlaying(false);
        };
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          setIsPlaying(false);
          console.error('Audio playback error:', error);
        };
        
        setCurrentAudio(audio);
        
        try {
          await audio.play();
        } catch (playError) {
          console.error('Audio play error:', playError);
          // Fallback to browser speech synthesis if audio fails
          const utterance = new SpeechSynthesisUtterance(text.substring(0, 4000));
          utterance.rate = aiSettings.voiceSpeed;
          utterance.volume = 0.8;
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
          
          // Clean up failed audio
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
        }
      } else {
        console.error('Failed to generate speech:', response.statusText);
        // Fallback to browser speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = aiSettings.voiceSpeed;
        utterance.volume = 0.8;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Voice playback error:', error);
      // Fallback to browser speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = aiSettings.voiceSpeed;
      utterance.volume = 0.8;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [aiSettings.soundEnabled, aiSettings.voice, aiSettings.voiceSpeed, stopAudio]);

  // Track last spoken message to prevent re-speaking
  const lastSpokenMessageIdRef = useRef<number | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const pageLoadTimeRef = useRef(Date.now());

  // Add keyboard shortcut for stopping audio (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPlaying) {
        stopAudio();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, stopAudio]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    console.log('[Voice Debug] Effect triggered', {
      hasScrollRef: !!scrollAreaRef.current,
      activeTab,
      messageCount: chatMessages.length,
      prevCount: previousMessageCountRef.current,
      soundEnabled: aiSettings.soundEnabled,
      pageLoadTime: pageLoadTimeRef.current
    });

    if (scrollAreaRef.current && activeTab === 'chat') {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
      
      // Get the last message
      const lastMessage = chatMessages[chatMessages.length - 1];
      
      // Check if this is a new message (created after page load)
      const messageCreatedTime = lastMessage ? new Date(lastMessage.createdAt).getTime() : 0;
      const isMessageAfterPageLoad = messageCreatedTime > pageLoadTimeRef.current;
      
      // Detect new messages by timestamp
      const isNewMessage = lastMessage && 
        lastMessage.createdAt !== lastMessageTimestampRef.current &&
        chatMessages.length > 0;
      
      if (lastMessage) {
        lastMessageTimestampRef.current = lastMessage.createdAt;
      }
      
      // Update count for other uses
      previousMessageCountRef.current = chatMessages.length;
      
      console.log('[Voice Debug] Message detection', {
        isNewMessage,
        isMessageAfterPageLoad,
        currentCount: chatMessages.length,
        lastMessageRole: lastMessage?.role,
        lastTimestamp: lastMessage?.createdAt,
        messageTime: messageCreatedTime,
        pageLoadTime: pageLoadTimeRef.current
      });
      
      // Auto-play voice ONLY for messages created after page load
      if (isNewMessage && isMessageAfterPageLoad) {
        console.log('[Voice Debug] Checking voice conditions', {
          hasLastMessage: !!lastMessage,
          role: lastMessage?.role,
          soundEnabled: aiSettings.soundEnabled,
          messageId: lastMessage?.id,
          agentId: lastMessage?.agentId,
          lastSpoken: lastSpokenMessageIdRef.current,
          isDifferent: lastMessage?.id !== lastSpokenMessageIdRef.current
        });

        // Only play voice for Production Scheduling Agent (Nova), not for Max
        const shouldPlayVoice = 
          lastMessage?.role === 'assistant' && 
          aiSettings.soundEnabled && 
          lastMessage.id !== lastSpokenMessageIdRef.current &&
          lastMessage?.agentId !== 'max'; // Disable voice for Max agent

        if (shouldPlayVoice) {
          // Mark this message as spoken to prevent re-playing
          lastSpokenMessageIdRef.current = lastMessage.id;
          
          console.log('[Voice] 🔊 Triggering TTS for message:', lastMessage.id, 'from agent:', lastMessage?.agentId);
          
          // Add small delay to ensure message is rendered
          setTimeout(() => {
            console.log('[Voice] Playing TTS now for agent:', lastMessage?.agentId);
            speakResponse(lastMessage.content);
          }, 300);
        }
      }
    }
  }, [chatMessages, activeTab, speakResponse, aiSettings.soundEnabled]);

  // Scroll detection for scroll button
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(isNearBottom);
    setShowScrollButton(!isNearBottom);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);
  
  const [showMaxThinking, setShowMaxThinking] = useState(false);
  const [currentRequestController, setCurrentRequestController] = useState<AbortController | null>(null);

  // Copy functionality
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };


  

  
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
    enabled: activeTab === 'insights'
  });
  
  // Cancel current Max request
  const cancelMaxRequest = () => {
    if (currentRequestController) {
      currentRequestController.abort();
      setCurrentRequestController(null);
      setShowMaxThinking(false);
      
      // Add cancellation message to chat
      addMessage({
        role: 'assistant',
        content: 'Request cancelled.',
        source: 'panel',
        agentId: 'max',
        agentName: 'Max'
      });
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Create new AbortController for this request
      const controller = new AbortController();
      setCurrentRequestController(controller);
      setShowMaxThinking(true);
      
      // Let Max AI backend handle all navigation logic for better intent understanding
      // Removed frontend navigation pattern matching that was interfering with Max AI
      
      // Route to Max AI (primary agent)
      const authToken = localStorage.getItem('auth_token');
      const endpoint = '/api/max-ai/chat';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          message,
          context: {
            currentPage: location,
            selectedData: null,
            recentActions: [],
            // Include scheduler context when on scheduler page
            ...(location === '/production-scheduler' && schedulerContext ? {
              schedulerContext: {
                currentView: schedulerContext.currentView,
                dateRange: schedulerContext.dateRange,
                resourceUtilization: schedulerContext.metrics?.resourceUtilization,
                scheduleCompliance: schedulerContext.metrics?.scheduleCompliance,
                totalEvents: schedulerContext.events?.total,
                pendingEvents: schedulerContext.events?.pending,
                conflicts: schedulerContext.events?.conflicts,
                selectedEvent: schedulerContext.selectedEvent,
                selectedResource: schedulerContext.selectedResource,
                criticalResources: schedulerContext.resources?.criticalResources,
                suggestions: []  // Scheduler context service removed
              }
            } : {})
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
    onSuccess: async (data: any) => {
      setShowMaxThinking(false);
      setCurrentRequestController(null);
      console.log("Max AI Full Response:", data);
      
      // Handle scheduler refresh action (after database updates)
      if (data?.action?.type === 'refresh_scheduler') {
        // Check if we're currently on the production scheduler page
        const currentPath = window.location.pathname;
        if (currentPath === '/production-scheduler') {
          // Find the production scheduler iframe and refresh it
          const iframe = document.querySelector('iframe[title="Production Scheduler"]') as HTMLIFrameElement;
          if (iframe) {
            console.log('🔄 Refreshing Production Scheduler after database update');
            // Force reload by changing the src with a cache buster
            const currentSrc = iframe.src.split('?')[0];
            iframe.src = `${currentSrc}?v=${Date.now()}`;
          }
        }
        
        // Show success message with the refresh note
        await addMessage({
          role: 'assistant',
          content: data.content + (currentPath === '/production-scheduler' ? '\n\n📊 The schedule has been refreshed to show your changes.' : ''),
          source: 'panel',
          agentId: data.agentId || 'production_scheduling',
          agentName: data.agentName || 'Production Scheduling Agent'
        });
        return;
      }
      
      // Handle apply algorithm action (ALAP, ASAP, etc.)
      if (data?.action?.type === 'apply_algorithm') {
        console.log('🎯 Applying scheduling algorithm:', data.action.data);
        
        // Check if we're on the production scheduler page
        const currentPath = window.location.pathname;
        if (currentPath === '/production-scheduler') {
          // Find the production scheduler iframe
          const iframe = document.querySelector('iframe[title="Production Scheduler"]') as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            console.log('📮 Sending algorithm command to scheduler iframe:', data.action.data.algorithm);
            
            // Send PostMessage to the iframe to apply the algorithm
            iframe.contentWindow.postMessage({
              type: 'applyAlgorithm',
              algorithm: data.action.data.algorithm,
              direction: data.action.data.direction
            }, '*');
            
            // Show success message
            await addMessage({
              role: 'assistant',
              content: data.content,
              source: 'panel',
              agentId: data.agentId || 'production_scheduling',
              agentName: data.agentName || 'Production Scheduling Agent'
            });
          } else {
            // Not on scheduler page, show navigation suggestion
            await addMessage({
              role: 'assistant',
              content: `To apply the ${data.action.data.algorithm} algorithm, please navigate to the Production Scheduler page first. Would you like me to take you there?`,
              source: 'panel',
              agentId: data.agentId || 'production_scheduling',
              agentName: data.agentName || 'Production Scheduling Agent'
            });
          }
        } else {
          // Not on scheduler page, suggest navigation
          await addMessage({
            role: 'assistant',
            content: `To apply the ${data.action.data.algorithm} algorithm, you need to be on the Production Scheduler page. Would you like me to navigate there?`,
            source: 'panel',
            agentId: data.agentId || 'production_scheduling',
            agentName: data.agentName || 'Production Scheduling Agent'
          });
        }
        return;
      }
      
      // Handle navigation actions from Max AI
      if (data?.action?.type === 'navigate' && data?.action?.target) {
        const target = data.action.target;
        // Handle external links (HTML files) by opening in new window
        if (target.endsWith('.html')) {
          window.open(target, '_blank');
        } else {
          handleNavigation(target, data.action.target.replace('/', '').replace('-', ' '));
        }
        
        // Show navigation confirmation
        await addMessage({
          role: 'assistant',
          content: data.content || `Navigating to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          source: 'panel',
          agentId: 'max',
          agentName: 'Max'
        });
        return;
      }
      
      // Handle chart creation actions from Max AI
      if (data?.action?.type === 'create_chart') {
        console.log('AI Left Panel - Handling create_chart action:', data.action);
        
        // Process chart data and add to canvas via Max Dock
        if (data.action.chartConfig && setCanvasItems) {
          const chartItem: CanvasItem = {
            id: `chart_${Date.now()}`,
            type: 'chart',
            title: data.action.title || 'AI Generated Chart',
            content: {
              chartType: data.action.chartType || data.action.chartConfig.chartType || 'bar',
              data: data.action.chartConfig.data || data.action.data || [],
              configuration: data.action.chartConfig
            },
            timestamp: new Date().toISOString()
          };
          
          // Add chart item to canvas
          setCanvasItems(prev => [...prev, chartItem]);
          
          // Save widget to database so it persists across sessions
          try {
            const widgetData = {
              type: 'chart',
              title: chartItem.title,
              position: { x: 0, y: 0, w: 6, h: 4 },
              config: {
                chartType: chartItem.content.chartType,
                data: chartItem.content.data,
                configuration: chartItem.content.configuration,
                createdByMaxAI: true
              },
              dashboardId: 1
            };

            const response = await apiRequest('POST', '/api/canvas/widgets', widgetData);

            if (response.ok) {
              console.log('✅ Widget saved to database successfully');
              // Invalidate canvas widgets cache to refresh the canvas
              queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
            } else {
              console.error('❌ Failed to save widget to database:', response.statusText);
            }
          } catch (error) {
            console.error('❌ Error saving widget to database:', error);
          }
          
          // Show canvas if not visible
          if (!isCanvasVisible) {
            setCanvasVisible(true);
          }
        }
        
        // Show chart creation confirmation
        await addMessage({
          role: 'assistant',
          content: data.content || 'I\'ve created a chart for you and added it to the canvas.',
          source: 'panel',
          agentId: 'max',
          agentName: 'Max'
        });
        return;
      }
      
      // Store response for display
      if (data?.content || data?.message) {
        const responseContent = data.content || data.message;
        
        await addMessage({
          role: 'assistant',
          content: responseContent,
          source: 'panel',
          agentId: 'max',
          agentName: 'Max'
        });

        // Don't play voice response for Max (only for other agents like Nova)
        // Voice is handled by the message effect for non-Max agents
        
        // If panel is collapsed, also show a temporary floating notification
        if (isCollapsed) {
          setFloatingNotification({
            id: Date.now(),
            role: 'assistant',
            content: responseContent,
            createdAt: new Date().toISOString(),
            source: 'panel'
          });
          setShowFloatingNotification(true);
          
          // Auto-hide after 10 seconds
          setTimeout(() => {
            setShowFloatingNotification(false);
            setTimeout(() => setFloatingNotification(null), 300);
          }, 10000);
        }
      } else if (!data?.action) {
        // If no content and no action, show a default response
        console.warn('Max AI response missing content:', data);
        await addMessage({
          role: 'assistant',
          content: 'I processed your request but didn\'t generate a response. Please try rephrasing your question.',
          source: 'panel'
        });
      }

      // Canvas actions are handled by the Max sidebar component, not the left panel
      if (data.canvasAction) {
        console.log('AI Left Panel - Canvas action detected but handled by Max sidebar:', data.canvasAction);
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
      
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        source: 'panel'
      });
    }
  });

  // Function to render content with clickable keywords and better formatting
  const renderContentWithClickableKeywords = (content: string) => {
    // Check if content is a bullet list
    const isBulletList = content.includes('\n-') || content.includes('\n•');
    
    if (isBulletList) {
      // Parse bullet list and render with better formatting
      const lines = content.split('\n').filter(line => line.trim());
      return (
        <div className="space-y-1.5">
          {lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
              const text = trimmedLine.substring(1).trim();
              return (
                <div key={index} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{text}</span>
                </div>
              );
            }
            return <div key={index} className="text-sm leading-relaxed">{trimmedLine}</div>;
          })}
        </div>
      );
    }
    
    // Define important patterns to make clickable
    const importantPatterns = [
      // Specific issues
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
      return <span className="text-sm leading-relaxed">{content}</span>;
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
            addMessage({
              role: 'user',
              content: replacement.query,
              source: 'panel'
            });
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
    
    return <span className="text-sm leading-relaxed">{elements}</span>;
  };





  // Auto-scroll chat to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (scrollAreaRef.current && chatMessages.length > 0) {
      // Always scroll to bottom on initial load or when opening the panel
      if (isNearBottom || chatMessages.length === 1) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        // Show scroll button if new message arrives while user is scrolled up
        setShowScrollButton(true);
      }
    }
  }, [chatMessages, isNearBottom, scrollToBottom]);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ai-panel-collapsed', isCollapsed.toString());
    
    // When panel opens (isCollapsed becomes false), reset to default chat tab and scroll to bottom
    if (!isCollapsed) {
      // Reset to default chat tab when opening
      setActiveTab('chat');
      
      // Small delay to ensure the panel animation completes and messages are rendered
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [isCollapsed, scrollToBottom]);

  // Listen for toggle event from command palette
  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed(prev => {
        // If we're opening the panel (prev was true, now will be false)
        if (prev) {
          // Scroll to bottom after opening
          setTimeout(() => {
            scrollToBottom();
          }, 300);
        }
        return !prev;
      });
    };
    document.addEventListener('toggle-ai-panel', handleToggle);
    return () => document.removeEventListener('toggle-ai-panel', handleToggle);
  }, [scrollToBottom]);

  // Scroll to bottom when chat tab is selected
  useEffect(() => {
    if (activeTab === 'chat' && chatMessages.length > 0) {
      // Small delay to ensure tab content is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [activeTab, scrollToBottom, chatMessages.length]);


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
      case 'insight': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'simulation': return Activity;
      default: return Sparkles;
    }
  };

  // File processing functions
  const processFile = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result) {
          reject(new Error("Failed to read file"));
          return;
        }

        const attachment = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          content: typeof result === 'string' ? result : '',
          url: file.type.startsWith("image/") ? (typeof result === 'string' ? result : '') : undefined,
          file: file // Store original File for upload
        };

        resolve(attachment);
      };

      reader.onerror = () => reject(new Error("Failed to read file"));

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const processedFiles = await Promise.all(files.map(processFile));
      setAttachments(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error("File processing error:", error);
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.includes("text") || type.includes("json")) return FileText;
    return File;
  };

  // Drag and drop handlers
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const processedFiles = await Promise.all(files.map(processFile));
      setAttachments(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error("File drop processing error:", error);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      let wasManuallyStopped = false;
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Auto-send if manually stopped by user (not timeout)
        await handleTranscription(audioBlob, wasManuallyStopped);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      // Store reference to set manual stop flag
      (recorder as any)._setManualStop = () => { wasManuallyStopped = true; };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTimeLeft(60); // Increased from 10 to 60 seconds

      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setRecordingTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after 60 seconds (increased from 10)
      const timeout = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
          setRecordingTimeLeft(0);
        }
        clearInterval(countdownInterval);
      }, 60000); // Changed from 10000 to 60000 ms

      setRecordingTimeout(timeout);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Mark as manually stopped (will trigger auto-send)
      if ((mediaRecorder as any)._setManualStop) {
        (mediaRecorder as any)._setManualStop();
      }
      
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTimeLeft(0);
      
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
    }
  };

  const handleTranscription = async (audioBlob: Blob, autoSend: boolean = false) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/ai-agent/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      if (result.success && result.text) {
        if (autoSend) {
          // IMMEDIATELY add user message to chat (don't wait for AI response)
          addMessage({
            role: 'user',
            content: result.text,
            source: 'panel'
          });
          
          // Show thinking indicator immediately
          setShowMaxThinking(true);
          
          // Send to AI backend (without re-adding user message since we already did)
          await sendMessageMutation.mutateAsync(result.text);
        } else {
          // Add transcribed text to the input field for user review
          setPrompt(prev => prev + (prev ? ' ' : '') + result.text);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSendMessage = async (messageToSend?: string) => {
    // Use provided message or fall back to prompt state
    const currentPrompt = messageToSend || prompt;
    
    if (!currentPrompt.trim() && attachments.length === 0) return;
    
    // Only clear the prompt state if we're using it (not a provided message)
    if (!messageToSend) {
      setPrompt('');
    }

    // Add user message immediately to chat UI (unless coming from voice transcription which already added it)
    const messageContent = currentPrompt || (attachments.length > 0 ? "Attached files for analysis" : "");
    if (!messageToSend) { // Only add if not from voice transcription 
      addMessage({
        role: 'user',
        content: messageContent,
        source: 'panel'
      });
    }

    // Send to AI via command endpoint (handles both text and attachments)
    setIsSendingCommand(true);
    try {
      console.log("Sending AI command:", currentPrompt, "attachments:", attachments.length);
      // Always send as FormData for consistency with backend
      const formData = new FormData();
      formData.append('command', currentPrompt || '');
      
      // Add each attachment using original File object
      for (const attachment of attachments) {
        formData.append('attachments', attachment.file);
      }

      console.log("Making request to /api/ai-agent/command");
      const response = await fetch('/api/ai-agent/command', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      console.log("Response status:", response.status, "ok:", response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log("AI Agent response JSON:", result);
        if (result.success) {
          console.log("Success case, adding message:", result.message);
          addMessage({
            role: 'assistant',
            content: result.message || 'Command processed successfully',
            source: 'panel'
          });
        } else {
          console.log("Error case, adding error message:", result.message);
          addMessage({
            role: 'assistant',
            content: result.message || 'Sorry, there was an error processing your message.',
            source: 'panel'
          });
        }
      } else {
        console.log("Response not ok, status:", response.status);
        const errorText = await response.text();
        console.log("Error response text:", errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      // Clear attachments after successful send
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        source: 'panel'
      });
    } finally {
      setIsSendingCommand(false);
    }
  };

  return (
    <div 
      className={cn(
        "h-full bg-background flex flex-col w-full",
        isCollapsed && "transition-all duration-300"
      )}
    >
      
      {/* Header */}
      <div className={cn("px-4 py-2 border-b flex items-center justify-between text-white", getThemeGradient(aiSettings.aiThemeColor))}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Agents</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {/* Navigation Icons - show when expanded */}
          {!isCollapsed && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('/canvas', 'AI Canvas')}
                className="text-white hover:text-white/80 bg-transparent"
                title="Open AI Canvas"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('/playbooks', 'Playbooks')}
                className="text-white hover:text-white/80 bg-transparent"
                title="Open Playbooks"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('/agent-history', 'Agent History')}
                className="text-white hover:text-white/80 bg-transparent"
                title="Open Agent History"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('/ai-insights', 'AI Insights')}
                className="text-white hover:text-white/80 bg-transparent"
                title="Open AI Insights"
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {/* Audio Control Button - show when audio is playing */}
          {isPlaying && (
            <Button
              variant="destructive"
              size="icon"
              onClick={stopAudio}
              className="bg-red-500 hover:bg-red-600 text-white animate-pulse"
              title="Stop audio playback (Esc key)"
            >
              <Square className="w-4 h-4 fill-white" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:text-white/80 bg-transparent"
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-3 mx-4 mt-2 text-xs">
              <TabsTrigger value="chat" className="px-2" title="Chat">
                <MessageSquare className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="simulations" className="px-2" title="Simulations">
                <Activity className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-2" title="Settings">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab - Display Only */}
            <TabsContent 
              value="chat" 
              className="flex-1 flex flex-col px-4 mt-2 overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="relative flex-1 overflow-hidden border rounded-md bg-background/50">
                {/* Floating Stop Audio Button - appears when TTS is playing */}
                {isPlaying && (
                  <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-right">
                    <Button
                      variant="destructive"
                      size="default"
                      onClick={stopAudio}
                      className="bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse"
                      title="Stop audio playback (Press Esc)"
                    >
                      <Square className="w-4 h-4 mr-2 fill-white" />
                      Stop Audio
                    </Button>
                  </div>
                )}
                
                {/* Voice Session Status Banner */}
                {realtimeVoice.isSessionActive && (
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {realtimeVoice.isListening ? (
                          <>
                            <div className="relative">
                              <Mic className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
                              <div className="absolute inset-0 bg-green-600 dark:bg-green-400 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              Listening...
                            </span>
                          </>
                        ) : realtimeVoice.isSpeaking ? (
                          <>
                            <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Max is speaking...
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              Voice Session Active
                            </span>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => realtimeVoice.stopSession()}
                        className="h-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <StopCircle className="w-3 h-3 mr-1" />
                        End
                      </Button>
                    </div>
                    {/* Live Transcripts */}
                    {(realtimeVoice.userTranscript || realtimeVoice.aiTranscript) && (
                      <div className="mt-2 space-y-1">
                        {realtimeVoice.userTranscript && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">You: </span>
                            <span className="italic">{realtimeVoice.userTranscript}</span>
                          </div>
                        )}
                        {realtimeVoice.aiTranscript && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Max: </span>
                            <span className="italic">{realtimeVoice.aiTranscript}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div 
                  className="absolute inset-0 p-3 overflow-y-auto" 
                  ref={scrollAreaRef}
                  onScroll={handleScroll}
                  style={{ height: '100%' }}
                >
                  {chatMessages.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">No conversation yet</p>
                      <p className="text-xs text-muted-foreground/70">Messages will appear here when you start chatting</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {chatMessages
                      .sort((a, b) => {
                        // First sort by timestamp
                        const timeA = new Date(a.createdAt).getTime();
                        const timeB = new Date(b.createdAt).getTime();
                        const timeDiff = timeA - timeB;
                        
                        // If times are very close (within 5 seconds), ensure user messages come before assistant messages
                        if (Math.abs(timeDiff) < 5000) {
                          // If one is user and one is assistant, prioritize user message first
                          if (a.role === 'user' && b.role === 'assistant') return -1;
                          if (a.role === 'assistant' && b.role === 'user') return 1;
                          // If both are same role, use ID for order
                          return a.id - b.id;
                        }
                        return timeDiff;
                      })
                      .map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === 'user' && "justify-end"
                        )}
                      >
                        <div
                          className={cn(
                            "flex flex-col gap-1 max-w-[90%]",
                            message.role === 'user' && "items-end"
                          )}
                        >
                          {/* Agent identifier for assistant messages */}
                          {message.role === 'assistant' && message.agentName && (
                            <div className="flex items-center gap-1 px-1">
                              <Sparkles className="h-3 w-3 text-purple-500" />
                              <span className="text-xs font-medium text-muted-foreground">
                                {message.agentName}
                              </span>
                            </div>
                          )}
                          
                          <div className={cn(
                            "relative group",
                            message.role === 'assistant' && "pr-8"
                          )}>
                            <div
                              className={cn(
                                "px-3 py-2 text-sm whitespace-normal break-words",
                                message.role === 'user'
                                  ? "rounded-lg bg-primary text-primary-foreground"
                                  : "rounded-3xl bg-muted"
                              )}
                            >
                              {message.role === 'assistant' 
                                ? renderContentWithClickableKeywords(message.content)
                                : message.content
                              }
                            </div>
                            
                            {/* Copy button for assistant messages */}
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(message.content, message.id.toString())}
                                className={cn(
                                  "absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                  "bg-background/80 hover:bg-background border border-border/50"
                                )}
                                title="Copy message"
                              >
                                {copiedMessageId === message.id.toString() ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground px-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
                
                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <Button
                    onClick={scrollToBottom}
                    size="sm"
                    className="absolute bottom-2 right-2 z-10 rounded-full shadow-lg"
                    title="Scroll to bottom"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Simulations Tab */}
            <TabsContent value="simulations" className="flex-1 overflow-hidden mt-2 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-3 pt-2 pb-4">
                  {/* Active Agents */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">Active Agents</h3>
                    {ALL_AGENTS.map((agent) => {
                      const isActive = agent.status === 'active';
                      
                      // Map icon names to Lucide icons
                      const getAgentIcon = () => {
                        switch (agent.icon) {
                          case 'Sparkles': return <Sparkles className="w-5 h-5 text-white" />;
                          case 'Calendar': return <Calendar className="w-5 h-5 text-white" />;
                          case 'Factory': return <Factory className="w-5 h-5 text-white" />;
                          case 'Shield': return <Shield className="w-5 h-5 text-white" />;
                          case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-white" />;
                          case 'Package': return <Package className="w-5 h-5 text-white" />;
                          case 'Layers': return <Layers className="w-5 h-5 text-white" />;
                          case 'Target': return <Target className="w-5 h-5 text-white" />;
                          case 'Wrench': return <Wrench className="w-5 h-5 text-white" />;
                          case 'Truck': return <Truck className="w-5 h-5 text-white" />;
                          case 'User': return <User className="w-5 h-5 text-white" />;
                          case 'DollarSign': return <DollarSign className="w-5 h-5 text-white" />;
                          case 'Monitor': return <Monitor className="w-5 h-5 text-white" />;
                          default: return <Lightbulb className="w-5 h-5 text-white" />;
                        }
                      };
                      
                      return (
                        <Card 
                          key={agent.id} 
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            !isActive && "opacity-60"
                          )}
                          onClick={() => {
                            // Chat functionality moved to floating bubble
                          }}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: agent.color || '#6B7280' }}
                                >
                                  {getAgentIcon()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    {agent.displayName}
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {agent.specialties?.[0] || 'Agent'}
                                  </p>
                                </div>
                              </div>
                              <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                  {Math.floor(Math.random() * 10 + 1)} actions
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  {Math.floor(Math.random() * 5)}
                                </span>
                              </div>
                              <div className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                isActive 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {isActive ? 'Active' : 'Idle'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

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
                  {/* Model Settings - Using standardized GPT-4o model */}
                  <div className="space-y-4">
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
                    
                    <div className="flex items-center justify-between pr-2">
                      <Label htmlFor="auto-suggestions" className="text-sm cursor-pointer">
                        Auto-suggestions
                      </Label>
                      <Switch
                        id="auto-suggestions"
                        checked={aiSettings.autoSuggestions}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, autoSuggestions: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between pr-2">
                      <Label htmlFor="show-insights" className="text-sm cursor-pointer">
                        Show insights
                      </Label>
                      <Switch
                        id="show-insights"
                        checked={aiSettings.showInsights}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, showInsights: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between pr-2">
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
                    
                    <div className="flex items-center justify-between pr-2">
                      <Label htmlFor="enable-voice" className="text-sm cursor-pointer">
                        Enable Voice Responses
                      </Label>
                      <Switch
                        id="enable-voice"
                        checked={aiSettings.soundEnabled}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, soundEnabled: checked }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="voice-mode" className="text-sm">Voice Mode</Label>
                      <Select value={aiSettings.voiceMode} onValueChange={(value) => setAiSettings(prev => ({ ...prev, voiceMode: value }))}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hybrid">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Hybrid (Recommended)</span>
                              <span className="text-xs text-muted-foreground">Web Speech + Whisper • ~$0.006/min</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="realtime">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Realtime (Premium)</span>
                              <span className="text-xs text-muted-foreground">OpenAI Realtime API • ~$0.15/min • Voice-to-voice</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {aiSettings.voiceMode === 'hybrid' 
                          ? 'Cost-effective with instant feedback'
                          : 'Premium conversational AI with natural voice-to-voice interaction'}
                      </p>
                      {aiSettings.voiceMode === 'realtime' && (
                        <div className="mt-2 space-y-2">
                          <Button
                            variant={realtimeVoice.isSessionActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => {
                              if (realtimeVoice.isSessionActive) {
                                realtimeVoice.stopSession();
                              } else {
                                realtimeVoice.startSession();
                              }
                            }}
                            className="w-full"
                          >
                            {realtimeVoice.isSessionActive ? (
                              <>
                                <StopCircle className="w-4 h-4 mr-2" />
                                Stop Voice Session
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4 mr-2" />
                                Start Voice Session
                              </>
                            )}
                          </Button>
                          {realtimeVoice.isConnected && (
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse" />
                              Connected • {realtimeVoice.isListening ? 'Listening...' : 'Ready'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="voice" className="text-sm">OpenAI Voice</Label>
                      <Select value={aiSettings.voice} onValueChange={(value) => setAiSettings(prev => ({ ...prev, voice: value }))}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nova">Nova - Clear Female (Recommended)</SelectItem>
                          <SelectItem value="alloy">Alloy - Balanced Neutral</SelectItem>
                          <SelectItem value="echo">Echo - Professional Male</SelectItem>
                          <SelectItem value="fable">Fable - Warm British Accent</SelectItem>
                          <SelectItem value="onyx">Onyx - Deep Authoritative Male</SelectItem>
                          <SelectItem value="shimmer">Shimmer - Gentle Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        High-quality OpenAI text-to-speech voices
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => speakResponse("Testing voice quality with OpenAI text-to-speech. This is how your selected voice sounds.")}
                        className="w-full mt-2"
                        disabled={!aiSettings.soundEnabled}
                      >
                        Test Voice
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="voice-speed" className="text-sm">
                        Voice Speed: {aiSettings.voiceSpeed}x
                      </Label>
                      <input
                        type="range"
                        id="voice-speed"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={aiSettings.voiceSpeed}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-2"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((aiSettings.voiceSpeed - 0.5) / (2 - 0.5)) * 100}%, #e5e7eb ${((aiSettings.voiceSpeed - 0.5) / (2 - 0.5)) * 100}%, #e5e7eb 100%)`
                        }}
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
                    
                    <div className="flex items-center justify-between pr-2">
                      <Label htmlFor="notifications" className="text-sm cursor-pointer">
                        AI notifications
                      </Label>
                      <Switch
                        id="notifications"
                        checked={aiSettings.notificationsEnabled}
                        onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between pr-2">
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
                      <input
                        type="range"
                        id="temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={aiSettings.temperature}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-2"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(aiSettings.temperature / 1) * 100}%, #e5e7eb ${(aiSettings.temperature / 1) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower = More focused, Higher = More creative
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="max-tokens" className="text-sm">
                        Response Length: {aiSettings.maxTokens} tokens
                      </Label>
                      <input
                        type="range"
                        id="max-tokens"
                        min={500}
                        max={4000}
                        step={500}
                        value={aiSettings.maxTokens}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-2"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((aiSettings.maxTokens - 500) / (4000 - 500)) * 100}%, #e5e7eb ${((aiSettings.maxTokens - 500) / (4000 - 500)) * 100}%, #e5e7eb 100%)`
                        }}
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
                    disabled={isSavingSettings}
                    onClick={async () => {
                      setIsSavingSettings(true);
                      
                      try {
                        // Save settings to localStorage
                        localStorage.setItem('ai-settings', JSON.stringify(aiSettings));
                        
                        // Save AI theme color to backend
                        if (user?.id) {
                          await apiRequest('PATCH', `/api/user-preferences/${user.id}`, {
                            aiThemeColor: aiSettings.aiThemeColor
                          });
                          
                          // Invalidate query to refresh preferences
                          queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user.id}`] });
                        }
                        
                        // Show success feedback
                        toast({
                          title: "Settings Saved",
                          description: "Your AI settings have been saved successfully.",
                        });
                        
                        // Brief delay to show saved state
                        await new Promise(resolve => setTimeout(resolve, 500));
                      } catch (error) {
                        console.error('Failed to save settings:', error);
                        
                        // Show error feedback
                        toast({
                          title: "Save Failed",
                          description: "Failed to save your settings. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsSavingSettings(false);
                      }
                    }}
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
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
          <div 
            className="relative cursor-pointer"
            onClick={() => {
              setIsCollapsed(false);
            }}
            title="Open Agents Panel"
            style={{ padding: '8px', background: 'none', border: 'none' }}
          >
            <MessageSquare className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <Separator className="w-6" />
          <div 
            className="relative cursor-pointer"
            onClick={() => {
              setIsCollapsed(false);
            }}
            title="View AI Insights (3 new)"
            style={{ padding: '8px', background: 'none', border: 'none' }}
          >
            <TrendingUp className="w-5 h-5" />
            <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              3
            </Badge>
          </div>

          <div 
            className="cursor-pointer"
            onClick={() => {
              setIsCollapsed(false);
            }}
            title="Run AI Simulations"
            style={{ padding: '8px', background: 'none', border: 'none' }}
          >
            <Activity className="w-5 h-5" />
          </div>
        </div>
      )}
      
      {/* Floating Notification - appears when panel is collapsed and there's a new message */}
      {showFloatingNotification && floatingNotification && isCollapsed && (
        <div className="fixed bottom-20 left-4 z-50 max-w-sm animate-in slide-in-from-left duration-300">
          <Card className="shadow-lg border-l-4 bg-background/95 backdrop-blur" style={{ borderLeftColor: getThemeGradient(aiSettings.aiThemeColor).includes('purple') ? '#a855f7' : getThemeGradient(aiSettings.aiThemeColor).includes('blue') ? '#3b82f6' : getThemeGradient(aiSettings.aiThemeColor).includes('emerald') ? '#10b981' : getThemeGradient(aiSettings.aiThemeColor).includes('orange') ? '#f97316' : getThemeGradient(aiSettings.aiThemeColor).includes('violet') ? '#8b5cf6' : '#06b6d4' }}>
            <CardHeader className={cn("pb-2 text-white", getThemeGradient(aiSettings.aiThemeColor))}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <CardTitle className="text-sm text-white">Max AI Reply</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowFloatingNotification(false);
                    setTimeout(() => setFloatingNotification(null), 300);
                  }}
                  className="h-6 w-6 p-0 text-white hover:text-white/80 bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {floatingNotification.content}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(floatingNotification.createdAt).toLocaleTimeString()}
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsCollapsed(false);
                    setShowFloatingNotification(false);
                    setTimeout(() => setFloatingNotification(null), 300);
                    // Auto-scroll to bottom after a brief delay to ensure panel is expanded
                    setTimeout(() => {
                      scrollToBottom();
                    }, 100);
                  }}
                  className="h-7 text-xs"
                >
                  View Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}