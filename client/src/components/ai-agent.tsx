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
import { Mic, MicOff, Send, Bot, User, Volume2, Settings, Paperclip, X, FileText, Image, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";
import { apiRequest } from "@/lib/queryClient";

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

export default function AIAgent() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      type: "agent",
      content: "Hello! I'm Max, your manufacturing AI assistant. I can help you with everything you can do in the interface: create jobs, operations, and resources, open and create dashboards, navigate to different pages, open the Gantt chart, create Kanban boards, analyze attached files, and much more. Try saying 'Open the Gantt chart', 'Create a new job form', 'Show me the analytics dashboard', or attach files for me to analyze.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isListening, setIsListening] = useState(false);
  const audioChunks = useRef<Blob[]>([]);
  
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
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
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
      
      const response = await fetch("/api/ai-agent/voice", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Voice transcription failed");
      }
      
      return response.json();
    },
    onSuccess: (data: { text: string }) => {
      const transcribedText = data.text;
      
      // Add user message with transcribed text
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        type: "user",
        content: transcribedText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Process the transcribed command
      textCommandMutation.mutate(transcribedText);
    },
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: "Failed to process voice command",
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
    
    // Add user message with attachments
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input || "Attached files for analysis",
      timestamp: new Date(),
      attachments: [...attachments]
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Process command with attachments
    textCommandMutation.mutate({ text: input, attachments });
    setInput("");
    setAttachments([]);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
        setIsListening(false);
      }
    } else {
      // Start recording - initialize microphone if needed
      const recorder = await initializeMicrophone();
      if (recorder) {
        recorder.start();
        setIsRecording(true);
        setIsListening(true);
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TooltipProvider>
      <Card 
        ref={dropZoneRef}
        className={`w-full max-w-2xl mx-auto h-[600px] flex flex-col transition-all ${
          isDragOver ? 'border-2 border-dashed border-blue-500 bg-blue-50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Manufacturing Assistant
            {isDragOver && (
              <Badge variant="secondary" className="ml-auto">
                Drop files here
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === "user" ? "bg-blue-500" : aiTheme.gradient
                  }`}>
                    {message.type === "user" ? 
                      <User className="w-4 h-4 text-white" /> : 
                      <Bot className="w-4 h-4 text-white" />
                    }
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.type === "user" 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-900"
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${aiTheme.gradient}`}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="rounded-lg p-3 bg-gray-100 text-gray-900">
                    <p className="text-sm">Processing your command...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
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
          <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</h4>
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
                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
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
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Listening...
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
                  <Paperclip className="w-4 h-4" />
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
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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