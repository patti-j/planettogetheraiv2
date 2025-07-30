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
  Share2,
  Copy,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_THEME_OPTIONS, AIThemeColor } from "@/lib/ai-theme";


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
    canvasItems,
    setMobileLayoutMode, 
    setCurrentFullscreenView,
    setCanvasVisible,
    setCanvasItems
  } = useMaxDock();
  const { getThemeClasses } = useAITheme();
  const { startTour } = useTour();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
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
      // Debug the response to track the issue
      console.log('=== FRONTEND MESSAGE DEBUG ===');
      console.log('Response message preview:', response.message.substring(0, 200));
      console.log('Response actions:', response.actions);
      console.log('Message contains API table:', response.message.includes('API Function'));
      console.log('Message contains job listing:', response.message.includes('Job ID') || response.message.includes('job name'));
      console.log('================================');
      
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
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
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
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
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
      const authToken = localStorage.getItem('authToken');
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
        setLocation(path);
        
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
        setLocation(navigationData.path);
        
        // Give user feedback about navigation
        toast({
          title: "Navigation",
          description: `Opened ${navigationData.page || 'page'}`,
        });
      } else if (navigationData.route) {
        // Legacy navigation with route
        const targetPath = navigationData.route.startsWith('/') ? navigationData.route : `/${navigationData.route}`;
        setLocation(targetPath);
        
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
            startTour(roleId, voiceEnabled, context);
            
            // Show success message
            toast({
              title: "Tour Started",
              description: `Guided tour initiated for role ${roleId} with voice ${voiceEnabled ? 'enabled' : 'disabled'}`,
            });
          } catch (tourError) {
            console.error('Error starting tour:', tourError);
            toast({
              title: "Tour Error",
              description: `Failed to start tour: ${tourError.message || 'Unknown error'}`,
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
              description: `Failed to start custom tour: ${customTourError.message || 'Unknown error'}`,
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
        description: `Unable to execute action: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const testVoice = async () => {
    const testText = `Hello! This is the ${VOICE_OPTIONS.find(v => v.value === selectedVoice)?.name} voice.`;
    await playTTSResponse(testText);
  };

  const handleCopyMessage = async (message: Message) => {
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
                className={`max-w-[80%] p-2 rounded-lg text-sm relative group ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
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
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex gap-2">
          <div className="flex-1 flex gap-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Ask me anything about your operations..."}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                <Mic className="h-4 w-4 text-green-600 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4 text-gray-500" />
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

    </div>
  );
}