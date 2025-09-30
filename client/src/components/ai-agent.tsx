import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Mic, MicOff, Send, Sparkles, User, Volume2, Settings, Paperclip, X, FileText, Image, File, Edit2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";
import { apiRequest } from "@/lib/queryClient";
import { useMaxDock } from "@/contexts/MaxDockContext";

interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // base64 for images, text content for documents
  url?: string; // for preview
}

interface AIMessage {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  actions?: string[];
  data?: any;
  attachments?: AttachmentFile[];
}

interface AIAgentResponse {
  success: boolean;
  message: string;
  data?: any;
  actions?: string[];
}

interface QueuedMessage {
  id: string;
  content: string;
  attachments: AttachmentFile[];
  timestamp: Date;
  status: "queued" | "processing" | "completed" | "failed";
  isEditing?: boolean;
}

interface AIAgentProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function AIAgent({ searchQuery = "", onSearchChange }: AIAgentProps = {}) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      type: "agent",
      content: "Hello! I'm Max, your manufacturing AI assistant. Here are my current API functions:\n\n**📊 Canvas Widget Management:**\n• Create interactive widgets (charts, tables, buttons, KPI dashboards)\n• Position and resize widgets on your canvas\n• Generate real-time production monitoring displays\n• Build custom manufacturing dashboards\n\n**🔧 Algorithm Feedback System:**\n• Submit automated performance analysis feedback\n• Report scheduling algorithm issues and improvements\n• Track algorithm execution metrics and optimization suggestions\n\n**📋 Manufacturing Operations:**\n• List jobs, operations, and resources with live data\n• Create and manage production orders\n• Navigate to any system page or dashboard\n• Open forms for jobs, operations, and resources\n\n**📁 File Analysis:**\n• Analyze attached documents and images\n• Extract manufacturing data from spreadsheets\n• Process technical drawings and specifications\n\nTry: 'Show me production widgets', 'Create a KPI dashboard', 'List current jobs', or attach files for analysis!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(10);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Message queue state
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  
  // Attachment state
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Voice settings state
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "alloy",
    gender: "female",
    speed: 1.1
  });
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();
  const { isMaxOpen } = useMaxDock();

  // Load voice settings from localStorage on component mount
  useEffect(() => {
    const savedVoiceSettings = localStorage.getItem("voiceSettings");
    if (savedVoiceSettings) {
      try {
        const settings = JSON.parse(savedVoiceSettings);
        setVoiceSettings(settings);
      } catch (error) {
        console.error("Failed to load voice settings:", error);
      }
    }
  }, []);

  // Save voice settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("voiceSettings", JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // File processing functions
  const processFile = async (file: File): Promise<AttachmentFile> => {
    return new Promise((resolve, reject) => {
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result) {
          reject(new Error("Failed to read file"));
          return;
        }

        let content = "";
        let url = "";

        if (file.type.startsWith("image/")) {
          // For images, store as base64 and create preview URL
          content = (result as string).split(",")[1]; // Remove data:image/...;base64, prefix
          url = result as string;
        } else if (file.type === "text/plain" || file.type === "application/json") {
          // For text files, store content directly
          content = result as string;
        } else if (file.type === "application/pdf") {
          // For PDFs, we'll process on the backend
          content = (result as string).split(",")[1];
        }

        resolve({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          url
        });
      };

      reader.onerror = () => reject(new Error("Failed to read file"));

      if (file.type.startsWith("image/") || file.type === "application/pdf") {
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
      toast({
        title: "Files Attached",
        description: `${files.length} file(s) added to your message`
      });
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "File Processing Failed",
        description: "One or more files could not be processed",
        variant: "destructive"
      });
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

  // Drag and drop handlers
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
      toast({
        title: "Files Attached",
        description: `${files.length} file(s) added via drag and drop`
      });
    } catch (error) {
      console.error("Drag and drop processing error:", error);
      toast({
        title: "File Processing Failed",
        description: "One or more files could not be processed",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type === "text/plain" || type === "application/json") return FileText;
    return File;
  };

  // Test voice function
  const testVoice = async () => {
    if (isTestingVoice) return;
    
    setIsTestingVoice(true);
    try {
      const testText = "Hello! This is how your voice settings will sound. I'm Max, your manufacturing AI assistant, ready to help you with production scheduling and operations.";
      
      const response = await fetch("/api/ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({
          text: testText,
          voice: voiceSettings.voice,
          gender: voiceSettings.gender,
          speed: voiceSettings.speed,
          role: "voice-test",
          stepId: "voice-test"
        })
      });

      if (!response.ok) {
        throw new Error(`Voice test failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsTestingVoice(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Voice Test Complete",
          description: "Voice settings preview finished"
        });
      };

      audio.onerror = (e) => {
        console.error("Voice test playback error:", e);
        setIsTestingVoice(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Voice Test Failed",
          description: "Could not play voice preview",
          variant: "destructive"
        });
      };

      await audio.play();
      toast({
        title: "Testing Voice Settings",
        description: "Playing voice preview..."
      });

    } catch (error) {
      console.error("Voice test error:", error);
      setIsTestingVoice(false);
      toast({
        title: "Voice Test Error",
        description: "Could not generate voice preview",
        variant: "destructive"
      });
    }
  };

  // Helper functions for Gantt controls
  const handleGanttZoom = (zoomLevel: string) => {
    // Send a custom event to the Gantt chart component
    const event = new CustomEvent('aiGanttZoom', { detail: { zoomLevel } });
    window.dispatchEvent(event);
    toast({ title: `Gantt chart zoom set to ${zoomLevel}` });
  };

  const handleGanttScroll = (scrollPosition: string) => {
    // Send a custom event to the Gantt chart component
    const event = new CustomEvent('aiGanttScroll', { detail: { scrollPosition } });
    window.dispatchEvent(event);
    toast({ title: `Gantt chart scrolled to ${scrollPosition}` });
  };

  const handleScrollToToday = () => {
    // Send a custom event to the Gantt chart component
    const event = new CustomEvent('aiScrollToToday', { detail: {} });
    window.dispatchEvent(event);
    toast({ title: "Scrolled to today's date" });
  };

  // Queue management functions
  const addToQueue = (content: string, attachments: AttachmentFile[] = []) => {
    const queuedMessage: QueuedMessage = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      attachments,
      timestamp: new Date(),
      status: "queued"
    };
    
    setMessageQueue(prev => [...prev, queuedMessage]);
    
    // Add user message to chat
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
      attachments
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Process queue if not already processing
    if (!isProcessingQueue) {
      processQueue();
    }
    
    return queuedMessage.id;
  };

  const removeFromQueue = (messageId: string) => {
    setMessageQueue(prev => prev.filter(msg => msg.id !== messageId));
    toast({
      title: "Message Removed",
      description: "Message removed from queue"
    });
  };

  const editQueuedMessage = (messageId: string, newContent: string) => {
    setMessageQueue(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, isEditing: false }
        : msg
    ));
    toast({
      title: "Message Updated",
      description: "Queued message has been updated"
    });
  };

  const toggleEditMode = (messageId: string) => {
    setMessageQueue(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isEditing: !msg.isEditing }
        : msg
    ));
  };

  const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    
    setIsProcessingQueue(true);
    
    // Find next queued message
    const nextMessage = messageQueue.find(msg => msg.status === "queued");
    if (!nextMessage) {
      setIsProcessingQueue(false);
      return;
    }
    
    // Mark as processing
    setMessageQueue(prev => prev.map(msg => 
      msg.id === nextMessage.id 
        ? { ...msg, status: "processing" }
        : msg
    ));
    setCurrentlyProcessing(nextMessage.id);
    
    try {
      // Process the message
      const payload = nextMessage.attachments.length > 0 
        ? { text: nextMessage.content, attachments: nextMessage.attachments }
        : nextMessage.content;
        
      const data = await textCommandMutation.mutateAsync(payload);
      
      // Mark as completed
      setMessageQueue(prev => prev.map(msg => 
        msg.id === nextMessage.id 
          ? { ...msg, status: "completed" }
          : msg
      ));
      
    } catch (error) {
      console.error("Queue processing error:", error);
      
      // Mark as failed
      setMessageQueue(prev => prev.map(msg => 
        msg.id === nextMessage.id 
          ? { ...msg, status: "failed" }
          : msg
      ));
      
      // Add error message to chat
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        type: "agent",
        content: "I encountered an error processing your message. Please try again or rephrase your request.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setCurrentlyProcessing(null);
    
    // Continue processing queue after a brief delay
    setTimeout(() => {
      setIsProcessingQueue(false);
      processQueue();
    }, 500);
  };

  // Process queue when new messages are added
  useEffect(() => {
    if (!isProcessingQueue && messageQueue.some(msg => msg.status === "queued")) {
      processQueue();
    }
  }, [messageQueue, isProcessingQueue]);

  // Text command mutation
  const textCommandMutation = useMutation({
    mutationFn: async (payload: string | { text: string; attachments: AttachmentFile[] }) => {
      let requestData;
      if (typeof payload === 'string') {
        // Legacy format for voice commands
        requestData = { command: payload };
      } else {
        // New format with attachments
        requestData = { 
          command: payload.text,
          attachments: payload.attachments
        };
      }
      
      console.log("Sending command:", requestData);
      const response = await apiRequest("POST", "/api/ai-agent/command", requestData);
      const data = await response.json();
      console.log("Received response:", data);
      return data;
    },
    onSuccess: (data: AIAgentResponse) => {
      const agentMessage: AIMessage = {
        id: Date.now().toString(),
        type: "agent",
        content: data.message,
        timestamp: new Date(),
        actions: data.actions,
        data: data.data
      };
      setMessages(prev => [...prev, agentMessage]);
      
      // Invalidate relevant queries if data was modified
      if (data.actions?.includes("CREATE_JOB") || data.actions?.includes("SEARCH_JOBS")) {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      }
      if (data.actions?.includes("CREATE_OPERATION") || data.actions?.includes("UPDATE_OPERATION")) {
        queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      }
      if (data.actions?.includes("CREATE_RESOURCE")) {
        queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      }
      if (data.actions?.includes("CREATE_KANBAN_BOARD")) {
        queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      }
      if (data.actions?.includes("CREATE_RESOURCE_VIEW")) {
        queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      }
      if (data.actions?.includes("CHANGE_COLOR_SCHEME") || data.actions?.includes("CHANGE_TEXT_LABELING")) {
        queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      }
      
      // Handle UI navigation actions
      if (data.actions?.includes("NAVIGATE_TO_PAGE")) {
        const path = data.data?.path || `/${data.data?.page}`;
        window.location.href = path;
      }
      
      if (data.actions?.includes("OPEN_DASHBOARD")) {
        window.location.href = "/dashboard";
      }
      
      if (data.actions?.includes("OPEN_GANTT_CHART")) {
        window.location.href = "/dashboard";
        // Send event to switch to Gantt view after navigation
        setTimeout(() => {
          const event = new CustomEvent('aiOpenGanttChart', { detail: {} });
          window.dispatchEvent(event);
        }, 1000);
      }
      
      // Handle form opening actions
      if (data.actions?.includes("OPEN_JOB_FORM")) {
        const event = new CustomEvent('aiOpenJobForm', { 
          detail: { formData: data.data?.formData || {} }
        });
        window.dispatchEvent(event);
      }
      
      if (data.actions?.includes("OPEN_OPERATION_FORM")) {
        const event = new CustomEvent('aiOpenOperationForm', { 
          detail: { formData: data.data?.formData || {} }
        });
        window.dispatchEvent(event);
      }
      
      if (data.actions?.includes("OPEN_RESOURCE_FORM")) {
        const event = new CustomEvent('aiOpenResourceForm', { 
          detail: { formData: data.data?.formData || {} }
        });
        window.dispatchEvent(event);
      }
      
      // Handle dashboard creation
      if (data.actions?.includes("CREATE_DASHBOARD")) {
        const event = new CustomEvent('aiCreateDashboard', { 
          detail: { dashboard: data.data?.dashboard }
        });
        window.dispatchEvent(event);
        // Navigate to dashboard after creation
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
      
      // Handle generic UI actions
      if (data.actions?.includes("TRIGGER_UI_ACTION")) {
        const event = new CustomEvent('aiTriggerUIAction', { 
          detail: { 
            action: data.data?.uiAction,
            target: data.data?.target,
            params: data.data?.params
          }
        });
        window.dispatchEvent(event);
      }

      // Handle special frontend actions
      if (data.actions?.includes("SET_GANTT_ZOOM")) {
        handleGanttZoom(data.data.zoomLevel);
      }
      if (data.actions?.includes("SET_GANTT_SCROLL")) {
        handleGanttScroll(data.data.scrollPosition);
      }
      if (data.actions?.includes("SCROLL_TO_TODAY")) {
        handleScrollToToday();
      }
      
      toast({
        title: data.success ? "Command executed" : "Command failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: (error) => {
      console.error("Text command error:", error);
      toast({
        title: "Error",
        description: "Failed to process command",
        variant: "destructive"
      });
    }
  });

  // Voice transcription mutation
  const voiceCommandMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.wav");
      
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch("/api/ai-agent/voice", {
        method: "POST",
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Voice transcription failed");
      }
      
      return response.json();
    },
    onSuccess: (data: { text: string }) => {
      const transcribedText = data.text;
      
      if (transcribedText) {
        // Add transcribed text to input field so user can review before sending
        setInput(prevInput => {
          const newText = prevInput ? `${prevInput} ${transcribedText}` : transcribedText;
          return newText;
        });
        
        toast({
          title: "Voice transcribed",
          description: `"${transcribedText.substring(0, 50)}${transcribedText.length > 50 ? '...' : ''}"`,
        });
      }
    },
    onError: (error) => {
      console.error("Voice transcription error:", error);
      toast({
        title: "Voice transcription failed",
        description: "Unable to transcribe voice recording. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize media recorder on first use
  const initializeMicrophone = async () => {
    if (mediaRecorder) return mediaRecorder;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        audioChunks.current = [];
        voiceCommandMutation.mutate(audioBlob);
      };
      
      setMediaRecorder(recorder);
      return recorder;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone unavailable",
        description: "Please allow microphone access to use voice commands",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    // Add to queue instead of direct processing
    addToQueue(input || "Attached files for analysis", [...attachments]);
    setInput("");
    setAttachments([]);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsListening(false);
      setRecordingTimeLeft(10);
      
      // Clear timers
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording manually
      stopRecording();
    } else {
      // Start recording - initialize microphone if needed
      const recorder = await initializeMicrophone();
      if (recorder) {
        recorder.start();
        setIsRecording(true);
        setIsListening(true);
        setRecordingTimeLeft(10);
        
        // Start countdown timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTimeLeft(prev => {
            if (prev <= 1) {
              // Auto-stop at 0
              return 10;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Auto-stop after 10 seconds
        recordingTimerRef.current = setTimeout(() => {
          stopRecording();
          toast({
            title: "Recording stopped",
            description: "10-second recording limit reached",
          });
        }, 10000);
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Add search query as a user message and process it
    addToQueue(searchQuery);
    onSearchChange?.(""); // Clear search after submission
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  return (
    <TooltipProvider>
      <Card 
        ref={dropZoneRef}
        className={`w-full max-w-full sm:max-w-2xl mx-auto h-screen sm:h-[600px] flex flex-col transition-all border-0 sm:border rounded-none sm:rounded-lg ${
          isDragOver ? 'border-2 border-dashed border-blue-500 bg-blue-50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader className="pb-4 px-4 sm:px-6">
          {/* Single Clean Header with Search */}
          <div className="flex items-center gap-4">
            <Sparkles className="w-6 h-6 text-gray-600 flex-shrink-0" />
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or ask Max..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 text-center placeholder:text-center"
              />
            </form>
            {isDragOver && (
              <Badge variant="secondary">
                Drop files here
              </Badge>
            )}
          </div>
        </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 px-4 sm:px-6">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {searchQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-2">
                {messages.filter(message => 
                  message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  message.actions?.some(action => action.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length} result(s) for "{searchQuery}"
              </div>
            )}
            {messages
              .filter(message => 
                !searchQuery || 
                message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                message.actions?.some(action => action.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                    message.type === "user" ? "bg-blue-500" : aiTheme.gradient
                  }`}>
                    {message.type === "user" ? 
                      <User className="w-4 h-4 text-white flex-shrink-0" /> : 
                      <Sparkles className="w-4 h-4 text-white flex-shrink-0" />
                    }
                  </div>
                  
                  <div className={`p-3 ${
                    message.type === "user" 
                      ? "bg-blue-500 text-white rounded-lg" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-3xl"
                  }`}>
                    <div 
                      className="text-sm whitespace-normal break-words"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(message.content, searchQuery) 
                      }}
                    />
                    
                    {/* Attachments Display */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment) => {
                          const FileIcon = getFileIcon(attachment.type);
                          return (
                            <div key={attachment.id} className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded text-xs">
                              <FileIcon className="w-4 h-4" />
                              <span className="flex-1 truncate">{attachment.name}</span>
                              <span className="text-xs opacity-70">
                                {(attachment.size / 1024).toFixed(1)}KB
                              </span>
                              {attachment.type.startsWith("image/") && attachment.url && (
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {message.actions && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.actions.map((action, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {(textCommandMutation.isPending || voiceCommandMutation.isPending) && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${aiTheme.gradient}`}>
                    <Sparkles className="w-4 h-4 text-white flex-shrink-0" />
                  </div>
                  <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <p className="text-sm">Processing your command...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Message Queue Display */}
        {messageQueue.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Message Queue ({messageQueue.length})</h3>
              <div className="flex items-center gap-2">
                {isProcessingQueue && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                )}
                {messageQueue.some(msg => msg.status === "completed" || msg.status === "failed") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMessageQueue(prev => prev.filter(msg => msg.status === "queued" || msg.status === "processing"));
                      toast({
                        title: "Queue Cleaned",
                        description: "Completed and failed messages removed"
                      });
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Clear Completed
                  </Button>
                )}
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {messageQueue.map((queuedMsg, index) => (
                <div
                  key={queuedMsg.id}
                  className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                    queuedMsg.status === "processing" ? "bg-blue-50 border border-blue-200" :
                    queuedMsg.status === "completed" ? "bg-green-50 border border-green-200" :
                    queuedMsg.status === "failed" ? "bg-red-50 border border-red-200" :
                    "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {queuedMsg.status === "processing" && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {queuedMsg.status === "completed" && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {queuedMsg.status === "failed" && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {queuedMsg.status === "queued" && (
                      <div className={`w-4 h-4 rounded-full ${aiTheme.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {queuedMsg.isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={queuedMsg.content}
                          onChange={(e) => {
                            const newContent = e.target.value;
                            setMessageQueue(prev => prev.map(msg => 
                              msg.id === queuedMsg.id 
                                ? { ...msg, content: newContent }
                                : msg
                            ));
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editQueuedMessage(queuedMsg.id, queuedMsg.content)}
                          className="h-6 px-2"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEditMode(queuedMsg.id)}
                          className="h-6 px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="truncate text-gray-900 dark:text-white">{queuedMsg.content}</p>
                    )}
                    
                    {queuedMsg.attachments.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Paperclip className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {queuedMsg.attachments.length} file{queuedMsg.attachments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {queuedMsg.status === "queued" && !queuedMsg.isEditing && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleEditMode(queuedMsg.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromQueue(queuedMsg.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove from queue</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                    
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(queuedMsg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Separator />
        
        {/* Voice Settings */}
        {showVoiceSettings && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Voice Settings</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={testVoice}
                disabled={isTestingVoice}
                className={`${aiTheme.gradient} text-white border-0`}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {isTestingVoice ? "Testing..." : "Test Voice"}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Voice</label>
                <Select
                  value={voiceSettings.voice}
                  onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, voice: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy (Clear)</SelectItem>
                    <SelectItem value="nova">Nova (Warm)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Bright)</SelectItem>
                    <SelectItem value="echo">Echo (Steady)</SelectItem>
                    <SelectItem value="fable">Fable (Deep)</SelectItem>
                    <SelectItem value="onyx">Onyx (Rich)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Gender</label>
                <Select
                  value={voiceSettings.gender}
                  onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Speed Control */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Speed ({voiceSettings.speed}x)
                </label>
                <Slider
                  value={[voiceSettings.speed]}
                  onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, speed: value[0] }))}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.5x</span>
                  <span>2.0x</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments ({attachments.length})</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAttachments([])}
                className="text-gray-500 hover:text-red-500 h-6 px-2"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-1">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.type);
                return (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border text-sm">
                    <FileIcon className="w-4 h-4 text-gray-600" />
                    <span className="flex-1 truncate">{attachment.name}</span>
                    <span className="text-xs text-gray-500">
                      {(attachment.size / 1024).toFixed(1)}KB
                    </span>
                    {attachment.type.startsWith("image/") && attachment.url && (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="w-6 h-6 object-cover rounded"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Input */}
        <div className="space-y-2">
          {isListening && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Recording...
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {recordingTimeLeft}s left
              </div>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.json,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your command, attach files, or use voice..."
              disabled={textCommandMutation.isPending || isRecording}
              className="flex-1"
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFiles || textCommandMutation.isPending}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach files (images, documents, PDFs)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleRecording}
                  disabled={voiceCommandMutation.isPending}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? "Stop voice recording" : "Start voice recording"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice settings</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  disabled={(!input.trim() && attachments.length === 0) || textCommandMutation.isPending || isRecording}
                  size="icon"
                  className={`${aiTheme.gradient} text-white`}
                >
                  {textCommandMutation.isPending ? "..." : <Send className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message with text and attachments to AI assistant</p>
              </TooltipContent>
            </Tooltip>
          </form>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}