import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mic, MicOff, Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIMessage {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  actions?: string[];
  data?: any;
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
      content: "Hello! I'm your manufacturing AI assistant. I can help you create jobs, operations, resources, manage your production schedule, create Kanban boards, and control Gantt chart views. Try saying something like 'Create a Kanban board to show jobs by status' or 'Create a Gantt view showing CNC resources with job names'.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isListening, setIsListening] = useState(false);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Text command mutation
  const textCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      console.log("Sending command:", command);
      const response = await apiRequest("POST", "/api/ai-agent/command", { command });
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
      
      // Handle special frontend actions
      if (data.actions?.includes("SET_GANTT_ZOOM")) {
        handleGanttZoom(data.data.zoomLevel);
      }
      if (data.actions?.includes("SET_GANTT_SCROLL")) {
        handleGanttScroll(data.data.scrollPosition);
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

  // Initialize media recorder
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream);
          setMediaRecorder(recorder);
          
          recorder.ondataavailable = (event) => {
            audioChunks.current.push(event.data);
          };
          
          recorder.onstop = () => {
            const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
            audioChunks.current = [];
            voiceCommandMutation.mutate(audioBlob);
          };
        })
        .catch(err => {
          console.error("Error accessing microphone:", err);
        });
    }
  }, []);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Process command
    textCommandMutation.mutate(input);
    setInput("");
  };

  const toggleRecording = () => {
    if (!mediaRecorder) {
      toast({
        title: "Microphone unavailable",
        description: "Please allow microphone access to use voice commands",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsListening(false);
    } else {
      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Manufacturing Assistant
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
                    message.type === "user" ? "bg-blue-500" : "bg-green-500"
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
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
        
        {/* Input */}
        <div className="space-y-2">
          {isListening && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Listening...
            </div>
          )}
          
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your command or use voice..."
              disabled={textCommandMutation.isPending || isRecording}
              className="flex-1"
            />
            
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              disabled={voiceCommandMutation.isPending}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              type="submit"
              disabled={!input.trim() || textCommandMutation.isPending || isRecording}
              size="icon"
            >
              {textCommandMutation.isPending ? "..." : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}