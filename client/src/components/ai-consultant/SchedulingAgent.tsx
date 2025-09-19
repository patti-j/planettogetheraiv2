import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  MessageSquare,
  Trash2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SchedulingConversation, SchedulingMessage } from "@shared/schema";

export function SchedulingAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<SchedulingConversation[]>({
    queryKey: ['/api/ai/schedule/conversations'],
    enabled: isOpen,
  });

  // Fetch messages for current conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<SchedulingMessage[]>({
    queryKey: currentConversationId ? ['/api/ai/schedule/messages', currentConversationId] : [],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ai/schedule/messages/${currentConversationId}`);
      return response.json();
    },
    enabled: !!currentConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: number }) => {
      console.log('[SchedulingAgent] Sending message:', { message: message.substring(0, 50), conversationId });
      
      try {
        const response = await apiRequest('POST', '/api/ai/schedule/query', {
          message,
          conversationId,
        });
        
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[SchedulingAgent] Received non-JSON response:', contentType);
          const text = await response.text();
          console.error('[SchedulingAgent] Response text:', text.substring(0, 200));
          throw new Error('Server returned an invalid response format. Please refresh and try again.');
        }
        
        const data = await response.json();
        
        // Check for error in response
        if (data.error) {
          console.error('[SchedulingAgent] API error:', data.error);
          throw new Error(data.error);
        }
        
        return data;
      } catch (error: any) {
        console.error('[SchedulingAgent] Error in mutationFn:', error);
        // Re-throw to be handled by onError
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[SchedulingAgent] Message sent successfully:', data.conversationId);
      setMessage("");
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/ai/schedule/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/schedule/messages', data.conversationId] });
    },
    onError: (error: any) => {
      console.error('[SchedulingAgent] Error sending message:', error);
      
      let errorMessage = 'Failed to send message';
      let errorDetails = '';
      
      // Parse different error types
      if (error?.message) {
        errorMessage = error.message;
        
        // Provide specific guidance for common errors
        if (error.message.includes('OpenAI API key')) {
          errorDetails = 'The AI service is not properly configured. Please contact support.';
        } else if (error.message.includes('rate limit')) {
          errorDetails = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('Invalid response format')) {
          errorDetails = 'The server is having issues. Please refresh the page and try again.';
        } else if (error.message.includes('Network')) {
          errorDetails = 'Network connection issue. Please check your connection and try again.';
        } else if (error.message.includes('quota')) {
          errorDetails = 'AI service quota exceeded. Please contact support.';
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage,
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      console.log('[SchedulingAgent] Deleting conversation:', conversationId);
      
      try {
        const response = await apiRequest('DELETE', `/api/ai/schedule/conversations/${conversationId}`);
        
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[SchedulingAgent] Delete received non-JSON response');
          throw new Error('Server returned an invalid response format');
        }
        
        return response.json();
      } catch (error: any) {
        console.error('[SchedulingAgent] Error in delete mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[SchedulingAgent] Conversation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/ai/schedule/conversations'] });
      setCurrentConversationId(null);
      setShowConversations(false);
    },
    onError: (error: any) => {
      console.error('[SchedulingAgent] Error deleting conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete conversation",
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message, conversationId: currentConversationId || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setShowConversations(false);
    setMessage("");
  };

  const selectConversation = (conversationId: number) => {
    setCurrentConversationId(conversationId);
    setShowConversations(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        data-testid="button-scheduling-assistant"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 z-50",
          isOpen && "hidden"
        )}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Chat Panel */}
      <div
        data-testid="panel-scheduling-assistant"
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l shadow-xl z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Scheduling Agent</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="button-conversations"
              variant="ghost"
              size="sm"
              onClick={() => setShowConversations(!showConversations)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              data-testid="button-close-assistant"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        {showConversations && (
          <div className="absolute top-14 left-0 right-0 bg-background border-b z-10 max-h-60 overflow-y-auto">
            <div className="p-2">
              <Button
                data-testid="button-new-conversation"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={startNewConversation}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
            {conversationsLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="pb-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between px-2 py-1 hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectConversation(conv.id)}
                  >
                    <div className="flex-1 truncate px-2 py-1">
                      <p className="text-sm font-medium truncate">
                        {conv.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 h-[calc(100%-8rem)]"
          data-testid="messages-area"
        >
          <div className="p-4 space-y-4">
            {messagesLoading && currentConversationId ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 && !currentConversationId ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Ask me anything about production scheduling!</p>
                <p className="text-xs mt-2">I can help with PlanetTogether, scheduling concepts, and optimization strategies.</p>
              </div>
            ) : messages.length === 0 && currentConversationId ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm mt-2">Loading messages...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  data-testid={`message-${msg.id}`}
                  className={cn(
                    "flex gap-3",
                    msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                      {msg.role === "assistant" ? "AI" : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%]",
                      msg.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
            {sendMessageMutation.isPending && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              data-testid="input-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about scheduling..."
              className="resize-none"
              rows={2}
              disabled={sendMessageMutation.isPending}
            />
            <Button
              data-testid="button-send"
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}