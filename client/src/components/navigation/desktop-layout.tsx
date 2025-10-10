import { useState, useEffect, useRef } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHeader } from '@/components/customizable-header';
import { AILeftPanel } from './ai-left-panel';
import { SlideOutMenu } from './slide-out-menu';
import { MinimizedNavPanel } from './minimized-nav-panel';
import TopMenu from '@/components/top-menu';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minimize, Send, Sparkles, Menu, Eye, EyeOff, Sidebar, ChevronDown, Calendar, Factory, Shield, Package, Users, Maximize, Mic, MicOff, Paperclip, StopCircle, Wrench, TrendingUp, Layers } from 'lucide-react';
import { getActiveAgents } from '@/config/agents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import { useLocation } from 'wouter';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAgent } from '@/contexts/AgentContext';
import { cn } from '@/lib/utils';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === 'desktop';
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const { user } = useAuth();
  const { addMessage } = useChatSync();
  const [location, setLocation] = useLocation();
  const { handleNavigation } = useSplitScreen();
  const { setCanvasVisible, setCanvasItems } = useMaxDock();
  const { currentAgent, switchToAgent } = useAgent();
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [isFloatingSending, setIsFloatingSending] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isFloatingBubbleMinimized, setIsFloatingBubbleMinimized] = useState(false);
  const [selectedFloatingAgent, setSelectedFloatingAgent] = useState<string>('unified');
  const floatingInputRef = useRef<HTMLInputElement>(null);
  
  // Sync floating bubble agent selection with AgentContext
  useEffect(() => {
    if (currentAgent && currentAgent.id !== 'max') {
      setSelectedFloatingAgent(currentAgent.id);
    }
  }, [currentAgent]);
  
  // Auto-scroll floating textarea to show the LAST line of text
  useEffect(() => {
    if (floatingInputRef.current) {
      floatingInputRef.current.scrollTop = floatingInputRef.current.scrollHeight;
    }
  }, [floatingPrompt]);
  
  // Voice recording state for floating bubble
  const [isFloatingRecording, setIsFloatingRecording] = useState(false);
  const [floatingMediaRecorder, setFloatingMediaRecorder] = useState<MediaRecorder | null>(null);
  const [floatingRecordingTimeout, setFloatingRecordingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [floatingRecordingTimeLeft, setFloatingRecordingTimeLeft] = useState<number>(0);
  const [isFloatingTranscribing, setIsFloatingTranscribing] = useState(false);
  const [floatingLiveTranscript, setFloatingLiveTranscript] = useState<string>('');
  const [continuousConversationMode, setContinuousConversationMode] = useState(false);
  const floatingRecognitionRef = useRef<any>(null);
  const floatingAudioChunksRef = useRef<Blob[]>([]);
  const floatingSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const floatingLastTranscriptRef = useRef<string>('');
  const floatingAccumulatedTextRef = useRef<string>('');
  
  // File attachment state for floating bubble
  const [floatingAttachments, setFloatingAttachments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    content?: string;
    url?: string;
    file: File;
  }>>([]);
  const [isFloatingProcessingFiles, setIsFloatingProcessingFiles] = useState(false);
  const floatingFileInputRef = useRef<HTMLInputElement>(null);
  
  // Panel force-show state for small screens
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [forcePanelsVisible, setForcePanelsVisible] = useState(false);
  
  // Check if navigation is pinned
  const [isNavigationPinned, setIsNavigationPinned] = useState(() => {
    try {
      return localStorage.getItem('navigationMenuPinned') === 'true';
    } catch {
      return false;
    }
  });

  // Panel width states for resizable panels
  const [aiPanelSize, setAiPanelSize] = useState(() => {
    try {
      const savedSize = localStorage.getItem('aiPanelSize');
      return savedSize ? parseInt(savedSize) : 25; // Default 25% of screen width
    } catch {
      return 25;
    }
  });
  
  const [navPanelSize, setNavPanelSize] = useState(() => {
    try {
      const savedSize = localStorage.getItem('navPanelSize');
      return savedSize ? parseInt(savedSize) : 20; // Default 20% of screen width
    } catch {
      return 20;
    }
  });

  // Track AI panel collapse state
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ai-panel-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Note: aiPanelRef no longer needed with direct state management

  // Calculate dynamic AI panel size based on collapse state - fix config error
  const currentAiPanelSize = isAiPanelCollapsed ? 6 : Math.max(aiPanelSize, 15);
  const currentAiPanelMinSize = isAiPanelCollapsed ? 4 : 15;
  const currentAiPanelMaxSize = isAiPanelCollapsed ? 8 : 40;

  // Debug logging will be added after variables are defined

  // Panel states no longer needed - panels are always visible but can be collapsed individually

  // Get AI settings for voice functionality
  const [aiSettings] = useState(() => {
    const saved = localStorage.getItem('ai-settings');
    let settings = {
      soundEnabled: false,
      voice: 'alloy',
      voiceSpeed: 1.0
    };
    
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        settings = { ...settings, ...parsedSettings };
      } catch (e) {
        // Fall back to defaults if parse fails
      }
    }
    
    return settings;
  });

  // Voice functionality for floating prompt
  const playVoiceResponse = async (text: string) => {
    if (!aiSettings.soundEnabled || !text) return;
    
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
          voice: aiSettings.voice || 'alloy',
          speed: aiSettings.voiceSpeed || 1.0
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      } else {
        console.error('Failed to generate speech:', response.statusText);
      }
    } catch (error) {
      console.error('Voice playback error:', error);
    }
  };

  // Floating Max AI message mutation
  const sendFloatingMessage = useMutation({
    mutationFn: async (message: string) => {
      const authToken = localStorage.getItem('auth_token');
      
      // Determine endpoint based on selected agent
      let endpoint = '/api/max-ai/chat';
      let requestBody: any = {
        message,
        context: {
          currentPage: location,
          selectedData: null,
          recentActions: []
        }
      };

      if (selectedFloatingAgent === 'unified') {
        // Use Max AI with unified routing indicator
        requestBody.context.agentMode = 'unified';
      } else if (selectedFloatingAgent !== 'max') {
        // For other specific agents, add agent context to Max AI
        requestBody.context.targetAgent = selectedFloatingAgent;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get response from ${selectedFloatingAgent === 'unified' ? 'AI agents' : 'selected agent'}`);
      }
      return await response.json();
    },
    onSuccess: async (data: any) => {
      setIsFloatingSending(false);
      
      // Determine which agent responded
      const respondingAgent = selectedFloatingAgent === 'unified' ? 
        (data?.agentId || 'max') : selectedFloatingAgent;
      
      // Add user message to chat with agent context
      addMessage({
        role: 'user',
        content: floatingPrompt,
        source: 'floating',
        agentId: respondingAgent
      });
      
      // Handle chart creation from Max AI
      if (data?.action?.type === 'create_chart' && data?.action?.chartConfig) {
        console.log('🎨 Chart creation detected from floating AI:', data.action);
        
        const chartItem = {
          id: data.action.widgetId || `canvas-${Date.now()}`,
          type: 'chart',
          data: data.action.chartConfig,
          title: data.action.chartConfig.title || 'AI Generated Chart',
          position: { x: 0, y: 0 }
        };
        
        setCanvasItems((prev: any[]) => [...prev, chartItem]);
        setCanvasVisible(true);
        
        // Save chart widget to database
        const saveChart = async () => {
          try {
            const widgetData = {
              type: 'chart',
              title: chartItem.title,
              position: { x: 0, y: 0, w: 8, h: 6 },
              config: {
                chartConfig: data.action.chartConfig,
                createdByMaxAI: true
              },
              dashboardId: 1
            };

            const authToken = localStorage.getItem('auth_token');
            const response = await fetch('/api/canvas/widgets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
              },
              body: JSON.stringify(widgetData)
            });

            if (response.ok) {
              console.log('✅ Chart widget saved to database successfully');
              // Invalidate canvas widgets cache to force refresh
              queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
            } else {
              console.error('❌ Failed to save chart widget to database:', response.statusText);
            }
          } catch (error) {
            console.error('❌ Error saving chart widget to database:', error);
          }
        };
        
        await saveChart();
        console.log('✅ Canvas item added and canvas shown:', chartItem);
        
        // Navigate to canvas immediately
        handleNavigation('/canvas', 'Canvas');
      }
      
      // Handle table/grid creation from Max AI
      if (data?.action?.type === 'show_table' || data?.action?.type === 'create_table' || 
          data?.action?.type === 'show_jobs_table') {
        console.log('📊 Table/grid creation detected from floating AI:', data.action);
        
        if (data.action.tableData) {
          const tableItem = {
            id: `table_${Date.now()}`,
            type: 'table',
            title: data.action.title || 'Data Table',
            content: {
              title: data.action.title || 'Data Table',
              rows: data.action.tableData.rows || [],
              columns: data.action.tableData.columns || []
            },
            timestamp: new Date().toISOString()
          };
          
          setCanvasItems((prev: any[]) => [...prev, tableItem]);
          setCanvasVisible(true);
          
          // Save table widget to database so it persists
          const saveWidget = async () => {
            try {
              const widgetData = {
                type: 'table',
                title: tableItem.title,
                position: { x: 0, y: 0, w: 8, h: 6 },
                config: {
                  columns: data.action.tableData.columns,
                  rows: data.action.tableData.rows,
                  createdByMaxAI: true
                },
                dashboardId: 1
              };

              const authToken = localStorage.getItem('auth_token');
              const response = await fetch('/api/canvas/widgets', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                },
                body: JSON.stringify(widgetData)
              });

              if (response.ok) {
                console.log('✅ Table widget saved to database successfully');
                // Invalidate canvas widgets cache to force refresh
                queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
                // Widget saved successfully, navigation will happen below
              } else {
                console.error('❌ Failed to save table widget to database:', response.statusText);
              }
            } catch (error) {
              console.error('❌ Error saving table widget to database:', error);
            }
          };
          
          await saveWidget();
          console.log('✅ Table added to canvas and navigating to Canvas page');
          
          // Navigate to canvas immediately to show the table
          handleNavigation('/canvas', 'Canvas');
        }
      }
      
      // Handle agent switching actions from Max AI
      if (data?.action?.type === 'switch_agent' && data?.action?.agentId) {
        switchToAgent(data.action.agentId);
        
        // Add agent switch confirmation message
        addMessage({
          role: 'assistant',
          content: data.content || `Switched to ${data.action.agentId}...`,
          source: 'floating',
          agentId: data.action.agentId
        });
      }
      // Handle navigation actions from Max AI
      else if (data?.action?.type === 'navigate' && data?.action?.target) {
        handleNavigation(data.action.target, data.action.target.replace('/', '').replace('-', ' '));
        
        // Add navigation confirmation message
        addMessage({
          role: 'assistant',
          content: data.content || `Taking you to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
          source: 'floating',
          agentId: respondingAgent
        });
      } else {
        // Add assistant response
        if (data?.content || data?.message || data?.response) {
          const responseContent = data.content || data.message || data.response;
          
          addMessage({
            role: 'assistant',
            content: responseContent,
            source: 'floating',
            agentId: respondingAgent
          });

          // Temporarily disabled voice response to fix looping issue
          // playVoiceResponse(responseContent);
        }
      }
      
      setFloatingPrompt('');
      
      // Auto-restart listening for continuous conversation flow
      if (continuousConversationMode) {
        console.log('🔄 Auto-restarting listening for continuous conversation...');
        setTimeout(() => {
          startFloatingListening(true);
        }, 1500); // Wait 1.5 seconds for AI response to complete speaking
      }
    },
    onError: (error: any) => {
      setIsFloatingSending(false);
      console.error("Floating AI Error:", error);
      
      addMessage({
        role: 'user',
        content: floatingPrompt,
        source: 'floating',
        agentId: selectedFloatingAgent
      });
      
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        source: 'floating',
        agentId: selectedFloatingAgent
      });
      
      setFloatingPrompt('');
    }
  });

  const handleFloatingSend = () => {
    if (!floatingPrompt.trim() || isFloatingSending) return;
    
    setIsFloatingSending(true);
    sendFloatingMessage.mutate(floatingPrompt);
  };

  // Voice recording handlers for floating bubble with real-time transcription
  const startFloatingListening = async (enableContinuous = true) => {
    try {
      console.log('🎙️ Starting real-time transcription for floating bubble...');
      setContinuousConversationMode(enableContinuous);
      
      // Initialize Web Speech API for instant feedback
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        console.log('Initializing Web Speech API for live transcription...');
        floatingRecognitionRef.current = new SpeechRecognition();
        floatingRecognitionRef.current.continuous = true;
        floatingRecognitionRef.current.interimResults = true;
        floatingRecognitionRef.current.lang = 'en-US';
        
        floatingRecognitionRef.current.onstart = () => {
          console.log('Web Speech API started');
          setFloatingLiveTranscript('');
          floatingLastTranscriptRef.current = '';
          floatingAccumulatedTextRef.current = '';
        };
        
        floatingRecognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              // Accumulate final transcript
              floatingAccumulatedTextRef.current += finalTranscript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Build the complete text from accumulated + current interim
          const newText = (floatingAccumulatedTextRef.current + interimTranscript).trim();
          setFloatingPrompt(newText);
          setFloatingLiveTranscript(newText);
          
          // Check if transcript has changed
          if (newText !== floatingLastTranscriptRef.current && newText.length > 0) {
            console.log('🎤 Speech detected, text:', newText);
            floatingLastTranscriptRef.current = newText;
            
            // Clear existing silence timer
            if (floatingSilenceTimerRef.current) {
              clearTimeout(floatingSilenceTimerRef.current);
              floatingSilenceTimerRef.current = null;
            }
            
            // Set new silence timer - auto-send after 2 seconds of no new speech
            if (newText.length > 3) {
              console.log('⏲️ Starting 2-second silence timer...');
              floatingSilenceTimerRef.current = setTimeout(() => {
                console.log('🔇 Detected 2 seconds of silence, auto-sending message...');
                stopFloatingListening(true); // Keep continuous mode active
              }, 2000);
            }
          }
        };
        
        // Add speech end detection (backup for browsers that support it)
        floatingRecognitionRef.current.onspeechend = () => {
          console.log('📝 Speech end event detected');
          // The silence timer handles auto-submission, so we just log here
        };
        
        floatingRecognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            console.log('No speech detected, waiting...');
          }
        };
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset state
      floatingAudioChunksRef.current = [];
      setFloatingLiveTranscript('');
      
      // Start Web Speech API if available
      if (floatingRecognitionRef.current) {
        try {
          floatingRecognitionRef.current.start();
          console.log('✅ Web Speech API started for instant transcription');
        } catch (err) {
          console.log('⚠️ Web Speech API unavailable, using Whisper only');
        }
      }
      
      // Setup MediaRecorder for Whisper backup
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          floatingAudioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('🎙️ Recording stopped, auto-sending message...');
        
        // Stop Web Speech API
        if (floatingRecognitionRef.current) {
          try {
            floatingRecognitionRef.current.stop();
          } catch (err) {
            console.log('Web Speech API already stopped');
          }
        }
        
        // Immediately send the Web Speech result if we have it
        const currentText = floatingPrompt.trim();
        if (currentText.length > 3) {
          console.log('📤 Sending message:', currentText);
          sendFloatingMessage.mutate(currentText);
        }
        
        // Process with Whisper in background for future improvements (don't wait)
        if (floatingAudioChunksRef.current.length > 0) {
          const audioBlob = new Blob(floatingAudioChunksRef.current, { type: 'audio/webm' });
          
          if (audioBlob.size >= 1000) {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            // Fire and forget - don't wait for Whisper
            const authToken = localStorage.getItem('auth_token');
            fetch('/api/ai-agent/voice', {
              method: 'POST',
              headers: {
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
              },
              body: formData
            }).then(response => {
              if (response.ok) {
                response.json().then(data => {
                  const whisperText = data.transcript?.trim();
                  console.log('🎯 Whisper transcription (for reference):', whisperText);
                });
              }
            }).catch(error => {
              console.log('⚠️ Whisper transcription failed:', error);
            });
          }
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setFloatingMediaRecorder(recorder);
      setIsFloatingRecording(true);
      setFloatingRecordingTimeLeft(30); // Increase to 30 seconds max
      
      // Auto-stop after 30 seconds (safety limit)
      const timeout = setTimeout(() => {
        console.log('⏰ Maximum recording time reached (30s)');
        stopFloatingListening(true); // Keep continuous mode active
      }, 30000);
      
      setFloatingRecordingTimeout(timeout);
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone Permission Needed",
        description: "Please allow microphone access to use voice input",
        variant: "destructive"
      });
    }
  };

  const stopFloatingListening = (keepContinuousMode = false) => {
    console.log('Stopping floating bubble voice recording...');
    
    // Only disable continuous mode if explicitly told to (user clicked stop)
    if (!keepContinuousMode) {
      setContinuousConversationMode(false);
    }
    
    // Clear silence timer
    if (floatingSilenceTimerRef.current) {
      clearTimeout(floatingSilenceTimerRef.current);
      floatingSilenceTimerRef.current = null;
      console.log('🔄 Silence timer cleared');
    }
    
    // Clear accumulated text
    floatingAccumulatedTextRef.current = '';
    
    // Stop Web Speech API
    if (floatingRecognitionRef.current) {
      try {
        floatingRecognitionRef.current.stop();
      } catch (err) {
        console.log('Web Speech API already stopped');
      }
    }
    
    // Stop MediaRecorder
    if (floatingMediaRecorder && floatingMediaRecorder.state === 'recording') {
      floatingMediaRecorder.stop();
    }
    
    // Clear timeout
    if (floatingRecordingTimeout) {
      clearTimeout(floatingRecordingTimeout);
      setFloatingRecordingTimeout(null);
    }
    
    setIsFloatingRecording(false);
    setFloatingRecordingTimeLeft(0);
    setFloatingLiveTranscript('');
  };

  const handleFloatingAudioRecording = async (audioBlob: Blob) => {
    setIsFloatingTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const authToken = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/whisper-transcribe', {
        method: 'POST',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          setFloatingPrompt(data.transcript);
          // Auto-send the transcribed message
          setTimeout(() => {
            setFloatingPrompt(data.transcript);
            sendFloatingMessage.mutate(data.transcript);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsFloatingTranscribing(false);
    }
  };

  // File attachment handlers for floating bubble
  const handleFloatingFileUpload = () => {
    floatingFileInputRef.current?.click();
  };

  const handleFloatingFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsFloatingProcessingFiles(true);

    try {
      const items = await Promise.all(Array.from(files).map(async (file) => {
        const id = Date.now() + Math.random().toString();
        
        // Read file content for text files
        let content: string | undefined;
        let url: string | undefined;

        if (file.type.startsWith('text/') || file.type === 'application/json') {
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.readAsText(file);
          });
        } else if (file.type.startsWith('image/')) {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.readAsDataURL(file);
          });
        }

        return { id, name: file.name, type: file.type, size: file.size, content, url, file };
      }));
      
      setFloatingAttachments(prev => [...prev, ...items]);
    } catch (err) {
      console.error('Error processing files:', err);
    } finally {
      setIsFloatingProcessingFiles(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeFloatingAttachment = (id: string) => {
    setFloatingAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Helper function to get agent icon
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'max': return Sparkles;
      case 'production_scheduling': return Calendar;
      case 'shop_floor': return Factory;
      case 'quality_management': return Shield;
      case 'predictive_maintenance': return Wrench;
      case 'demand_management': return TrendingUp;
      case 'supply_plan': return Package;
      case 'inventory_planning': return Layers;
      case 'unified': return Users;
      default: return Sparkles;
    }
  };

  // Get active agents for selection
  const activeAgents = getActiveAgents();
  const unifiedOption = { id: 'unified', name: 'Unified Discussion', displayName: 'All Agents' };

  // Handle panel size changes and persistence
  const handlePanelResize = (sizes: number[]) => {
    // Only handle AI panel size when navigation is pinned (3 panels)
    if (isNavigationPinned && sizes.length === 3) {
      const [aiSize, , navSize] = sizes; // [ai, main, nav]
      
      // Update states
      setAiPanelSize(aiSize);
      setNavPanelSize(navSize);
      
      // Save to localStorage
      try {
        localStorage.setItem('aiPanelSize', aiSize.toString());
        localStorage.setItem('navPanelSize', navSize.toString());
      } catch {
        // Ignore localStorage errors
      }
    } else if (!isNavigationPinned && sizes.length === 2) {
      // Only AI panel and main content when navigation is not pinned
      const [aiSize] = sizes;
      
      setAiPanelSize(aiSize);
      
      try {
        localStorage.setItem('aiPanelSize', aiSize.toString());
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Toggle pin functionality
  const handleTogglePin = () => {
    const newPinned = !isNavigationPinned;
    setIsNavigationPinned(newPinned);
    try {
      localStorage.setItem('navigationMenuPinned', newPinned.toString());
    } catch {
      // Ignore localStorage errors
    }
  };

  // Listen for navigation pinned state changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const pinned = localStorage.getItem('navigationMenuPinned') === 'true';
        setIsNavigationPinned(pinned);
      } catch {
        // Ignore errors
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Store reference to panel group for force updates
  const [panelGroupKey, setPanelGroupKey] = useState(0);

  // Listen for AI panel collapse state changes
  useEffect(() => {
    const handleAiPanelStorageChange = () => {
      try {
        const collapsed = localStorage.getItem('ai-panel-collapsed') === 'true';
        if (collapsed !== isAiPanelCollapsed) {
          if (!collapsed) {
            // Expanding - restore saved size with minimum 25% for proper visibility
            const savedSize = localStorage.getItem('aiPanelSize');
            let targetSize = 25; // Default to 25%
            
            if (savedSize) {
              const parsedSize = parseInt(savedSize);
              if (parsedSize >= 15) {
                targetSize = parsedSize; // Use saved size if it's reasonable
              }
            }
            
            setAiPanelSize(targetSize);
            
            // Force panel group to refresh layout
            setPanelGroupKey(prev => prev + 1);
          } else {
            // Collapsing - save current size for later restoration
            localStorage.setItem('aiPanelSize', aiPanelSize.toString());
          }
          setIsAiPanelCollapsed(collapsed);
        }
      } catch {
        // Ignore errors
      }
    };
    
    window.addEventListener('storage', handleAiPanelStorageChange);
    const interval = setInterval(handleAiPanelStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleAiPanelStorageChange);
      clearInterval(interval);
    };
  }, [isAiPanelCollapsed, aiPanelSize]);

  // Track window width for responsive panel hiding
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Reset force-show when going back to larger screen
      if (window.innerWidth >= 768) {
        setForcePanelsVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add keyboard support for exiting fullscreen with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        toggleFullScreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, toggleFullScreen]);

  // Focus the floating input when the bubble expands
  useEffect(() => {
    if (!isFloatingBubbleMinimized && floatingInputRef.current) {
      floatingInputRef.current.focus();
    }
  }, [isFloatingBubbleMinimized]);

  // Determine if panels should be hidden - only hide on actual mobile devices (touch + small screen)
  // Never hide panels on desktop, regardless of window size
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  const isActualMobile = isTouchDevice && windowWidth < 768;
  const shouldHidePanels = isActualMobile && !forcePanelsVisible;
  
  // Show panels normally (removed special case for production scheduler)
  const showPanels = !isFullScreen && !shouldHidePanels;
  
  // VERY OBVIOUS DEBUG LOGGING
  console.log('🚨🚨🚨 DESKTOP LAYOUT IS RENDERING 🚨🚨🚨');
  console.log('🐛 Desktop Layout Debug:', {
    showPanels,
    isNavigationPinned,
    currentAiPanelSize,
    aiPanelSize,
    isAiPanelCollapsed,
    location,
    windowWidth,
    isFullScreen
  });
  console.log('🚨🚨🚨 END DESKTOP LAYOUT DEBUG 🚨🚨🚨');

  // For very small screens (actual mobile), render content directly without TopMenu
  // Only do this for screens smaller than 320px (actual mobile devices)
  if (windowWidth < 320) {
    return <>{children}</>;
  }

  // For desktop, use the new enhanced navigation components
  return (
    <div className="h-screen flex flex-col">
      
      {/* Customizable desktop header - hidden in full screen */}
      {!isFullScreen && (
        <CustomizableHeader />
      )}
      
      {/* Main content area with resizable AI panel on left and navigation on right */}
      {showPanels ? (
        isNavigationPinned ? (
          /* Layout with AI panel, main content, and pinned navigation (3 panels) */
          <>
          <ResizablePanelGroup 
            direction="horizontal" 
            className="flex-1 overflow-hidden"
            onLayout={handlePanelResize}
          >
            {/* AI Panel - resizable left panel */}
            <ResizablePanel 
              defaultSize={currentAiPanelSize} 
              minSize={currentAiPanelMinSize} 
              maxSize={currentAiPanelMaxSize}
              className="min-w-0"
            >
              <AILeftPanel />
            </ResizablePanel>
            
            {/* Resizable handle for AI panel */}
            <ResizableHandle withHandle className="w-[1px] bg-border/80 hover:bg-primary/20 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
            
            {/* Main content panel */}
            <ResizablePanel minSize={30}>
              <div className="flex flex-col h-full">
                
                {/* TopMenu for navigation menu - hidden in full screen */}
                {!isFullScreen && (
                  <TopMenu 
                    onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
                    isNavPanelOpen={isNavigationOpen}
                  />
                )}
                
                {/* Main content area */}
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </div>
            </ResizablePanel>
            
            {/* Resizable handle for navigation panel */}
            <ResizableHandle withHandle className="w-[6px] bg-gradient-to-r from-border/40 via-border/60 to-border/40 hover:from-primary/15 hover:via-primary/25 hover:to-primary/15 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
            
            {/* Navigation panel - resizable */}
            <ResizablePanel 
              defaultSize={Math.max(navPanelSize, 15)} 
              minSize={15} 
              maxSize={35}
              className="min-w-0"
            >
              <div className="h-full flex flex-col bg-background border-l border-border">
                <SlideOutMenu 
                  isOpen={true}
                  onClose={() => {}}
                  width={undefined} // Let panel handle width
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          </>
        ) : (
          /* Layout with AI panel and main content only (2 panels) */
          <div className="flex flex-1 overflow-hidden">
            <ResizablePanelGroup 
              direction="horizontal" 
              className="flex-1 overflow-hidden"
              onLayout={handlePanelResize}
            >
              {/* AI Panel - resizable left panel */}
              <ResizablePanel 
                defaultSize={currentAiPanelSize} 
                minSize={currentAiPanelMinSize} 
                maxSize={currentAiPanelMaxSize}
                className="min-w-0"
              >
                <AILeftPanel />
              </ResizablePanel>
              
              {/* Resizable handle for AI panel */}
              <ResizableHandle withHandle className="w-[1px] bg-border/80 hover:bg-primary/20 hover:w-2 transition-all duration-300 ease-out cursor-col-resize" />
              
              {/* Main content panel */}
              <ResizablePanel minSize={30}>
                <div className="flex flex-col h-full">
                  
                  {/* TopMenu for navigation menu - hidden in full screen */}
                  {!isFullScreen && (
                    <TopMenu 
                      onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
                      isNavPanelOpen={isNavigationOpen}
                    />
                  )}
                  
                  {/* Main content area */}
                  <div className="flex-1 overflow-auto">
                    {children}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
            
            {/* Minimized Navigation Panel - positioned absolutely */}
            <MinimizedNavPanel 
              onExpand={() => setIsNavigationOpen(true)}
              isPinned={isNavigationPinned}
              onTogglePin={handleTogglePin}
            />
          </div>
        )
      ) : (
        /* Fallback layout when panels are hidden */
        <div className="flex-1 flex flex-col">
          {/* TopMenu for navigation menu - hidden in full screen */}
          {!isFullScreen && (
            <TopMenu 
              onToggleNavPanel={() => setIsNavigationOpen(!isNavigationOpen)}
              isNavPanelOpen={isNavigationOpen}
            />
          )}
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      )}
      

      {/* Panel Toggle Button - Show when panels are hidden due to mobile device */}
      {!isFullScreen && shouldHidePanels && (
        <div className="fixed top-4 left-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setForcePanelsVisible(!forcePanelsVisible)}
                  size="sm"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-muted"
                >
                  <Sidebar className="h-4 w-4 mr-2" />
                  Show Panels
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Show navigation and AI panels</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Panel Hide Button - Show when panels are force-visible on mobile */}
      {!isFullScreen && forcePanelsVisible && isActualMobile && (
        <div className="fixed top-4 left-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setForcePanelsVisible(false)}
                  size="sm"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-muted"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Panels
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Hide panels to see more content</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Floating Exit Fullscreen Button - only visible in fullscreen mode */}
      {isFullScreen && (
        <div className="fixed top-4 right-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleFullScreen}
                  size="sm"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-muted flex items-center gap-2"
                  data-testid="button-exit-fullscreen"
                >
                  <Minimize className="h-4 w-4" />
                  <span className="text-sm font-medium">Exit Fullscreen</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Exit fullscreen mode (or press Escape)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {/* Floating Max AI Prompt - toggles between minimized circle and expanded oval */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50">
        {isFloatingBubbleMinimized ? (
          // Minimized circular icon
          <Button
            onClick={() => setIsFloatingBubbleMinimized(false)}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-expand-floating-ai"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>
        ) : (
          // Expanded oval prompt - flexible layout with text wrapping
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-0.5 rounded-3xl shadow-lg backdrop-blur-sm">
            <div className="bg-background rounded-3xl p-1.5 flex flex-col gap-0.5 min-w-[340px] max-w-[520px]">
              {/* Top row: Agent selector, input field, and send button */}
              <div className="flex items-center gap-0">
                {/* Agent Selection Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsFloatingBubbleMinimized(true)}
                        size="sm"
                        variant="ghost"
                        className="rounded-full w-6 h-6 p-0 hover:bg-muted flex-shrink-0"
                        data-testid="button-minimize-floating-ai"
                      >
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{selectedFloatingAgent === 'unified' ? 'All Agents' : activeAgents.find(a => a.id === selectedFloatingAgent)?.displayName || 'Current Agent'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Input Field - wrapped in flex-1 div to allow proper text wrapping */}
                <div className="flex-1 min-w-[180px]">
                  <textarea
                    ref={floatingInputRef as any}
                    placeholder={isFloatingRecording ? "Speak now - text appears instantly..." : selectedFloatingAgent === 'unified' ? "Ask anything..." : `Ask ${activeAgents.find(a => a.id === selectedFloatingAgent)?.displayName || 'agent'}...`}
                    value={floatingPrompt}
                    onChange={(e) => setFloatingPrompt(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFloatingSend();
                      }
                    }}
                    className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus:outline-none text-sm placeholder:text-muted-foreground w-full resize-none overflow-hidden pl-1 ${isFloatingRecording ? 'text-green-600' : ''}`}
                    disabled={isFloatingSending}
                    rows={1}
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>

                {/* Attachment Pills */}
                {floatingAttachments.length > 0 && (
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {floatingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs max-w-[100px]"
                      >
                        <span className="truncate">{attachment.name}</span>
                        <Button
                          onClick={() => removeFloatingAttachment(attachment.id)}
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleFloatingSend}
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-7 h-7 p-0 hover:bg-muted flex-shrink-0"
                  disabled={!floatingPrompt.trim() || isFloatingSending}
                >
                  {isFloatingSending ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {/* Bottom row: Smaller icons for file attachment and voice recording */}
              <div className="flex items-center gap-1.5 pl-7">
                {/* Agent Selector Dropdown - Visible */}
                <Select value={selectedFloatingAgent} onValueChange={setSelectedFloatingAgent}>
                  <SelectTrigger className="h-5 w-auto min-w-[80px] border border-purple-300 bg-purple-50 text-xs hover:bg-purple-100 focus:ring-1 focus:ring-purple-400 px-2 rounded-full">
                    <SelectValue>
                      {selectedFloatingAgent === 'unified' ? (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-600" />
                          <span className="text-purple-700 font-medium">All Agents</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {(() => {
                            const agent = activeAgents.find(a => a.id === selectedFloatingAgent);
                            const IconComponent = agent ? getAgentIcon(agent.id) : Sparkles;
                            return (
                              <>
                                <IconComponent className="w-3 h-3 text-purple-600" />
                                <span className="text-purple-700 font-medium">{agent?.displayName || 'Agent'}</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="unified" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>All Agents</span>
                      </div>
                    </SelectItem>
                    {activeAgents.map((agent) => {
                      const IconComponent = getAgentIcon(agent.id);
                      return (
                        <SelectItem key={agent.id} value={agent.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-3 h-3" />
                            <span>{agent.displayName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* File attachment input (hidden) */}
                <input
                  ref={floatingFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFloatingFilesSelected}
                  accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.sql,.log,image/*"
                />

                {/* Clipboard/File Attachment Button - smaller */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleFloatingFileUpload}
                        size="sm"
                        variant="ghost"
                        className="rounded-full w-4 h-4 p-0 hover:bg-muted flex-shrink-0"
                        disabled={isFloatingProcessingFiles || isFloatingSending}
                      >
                        {isFloatingProcessingFiles ? (
                          <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Paperclip className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Attach files</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Voice Recording Button - smaller */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          if (isFloatingRecording) {
                            stopFloatingListening();
                          } else {
                            startFloatingListening(true); // Enable continuous mode
                          }
                        }}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "rounded-full w-4 h-4 p-0 hover:bg-muted flex-shrink-0 relative",
                          isFloatingRecording && "bg-transparent hover:bg-transparent",
                          continuousConversationMode && "ring-1 ring-red-400",
                          isFloatingTranscribing && "opacity-50"
                        )}
                        disabled={isFloatingTranscribing || isFloatingSending}
                      >
                        {isFloatingTranscribing ? (
                          <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isFloatingRecording ? (
                          <div className="voice-recording-container flex items-center justify-center">
                            {/* Pulsing rings */}
                            <div className="absolute w-4 h-4 bg-red-500 rounded-full opacity-30 voice-pulse-ring-1"></div>
                            <div className="absolute w-4 h-4 bg-red-500 rounded-full opacity-20 voice-pulse-ring-2"></div>
                            <div className="absolute w-4 h-4 bg-red-500 rounded-full opacity-10 voice-pulse-ring-3"></div>
                            {/* Central dot without microphone */}
                            <div className="relative z-10 w-1.5 h-1.5 bg-red-500 rounded-full voice-mic-glow"></div>
                          </div>
                        ) : (
                          <Mic className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{continuousConversationMode ? 'Continuous conversation mode active' : isFloatingRecording ? 'Speak now - text appears instantly' : isFloatingTranscribing ? 'Processing...' : 'Voice message (real-time transcription)'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Navigation Menu - only show when not pinned */}
      {!isNavigationPinned && !isFullScreen && (
        <SlideOutMenu 
          isOpen={isNavigationOpen}
          onClose={() => setIsNavigationOpen(false)}
          width={undefined} // Use default width for overlay mode
        />
      )}
    </div>
  );
}