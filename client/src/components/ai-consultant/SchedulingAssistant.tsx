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

export function SchedulingAssistant() {
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
      const response = await apiRequest('POST', '/api/ai/schedule/query', {
        message,
        conversationId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/ai/schedule/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/schedule/messages', data.conversationId] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to send message';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest('DELETE', `/api/ai/schedule/conversations/${conversationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/schedule/conversations'] });
      setCurrentConversationId(null);
      setShowConversations(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation",
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
            <h2 className="font-semibold">Scheduling Assistant</h2>
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
                      {new Date(msg.createdAt!).toLocaleTimeString()}
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