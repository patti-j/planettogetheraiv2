import { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MaxAIHeaderPromptProps {
  showText?: boolean;
}

export function MaxAIHeaderPrompt({ showText = true }: MaxAIHeaderPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Get user preferences for AI theme
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

  // Mutation for sending AI prompt
  const sendPromptMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/max-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message,
          userId: user?.id,
          context: {
            page: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        })
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: data.content || data.response || 'I understand your request. Let me help you with that.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsThinking(false);
    },
    onError: (error) => {
      console.error('Failed to send prompt:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setIsThinking(false);
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Show chat panel
    setShowChat(true);
    setIsThinking(true);
    
    // Send to AI
    sendPromptMutation.mutate(prompt);
    
    // Clear input
    setPrompt('');
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus the input (without opening chat)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to close chat
      if (e.key === 'Escape' && showChat) {
        setShowChat(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChat]);

  return (
    <Popover open={showChat} onOpenChange={setShowChat}>
      <PopoverTrigger asChild>
        <div className="relative flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <form onSubmit={handleSubmit} className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask Max AI... (⌘K)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={cn(
                "h-8 transition-all duration-200",
                showText ? "w-48 lg:w-64" : "w-32 lg:w-48",
                "placeholder:text-xs"
              )}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={!prompt.trim() || sendPromptMutation.isPending}
            >
              {sendPromptMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="flex flex-col h-[400px]">
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-3 text-white",
            getThemeGradient('purple-pink')
          )}>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">Max AI Assistant</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChat(false)}
              className="h-6 w-6 p-0 hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ask Max anything about your operations!</p>
                <p className="text-xs mt-2">Try: "Show me today's production metrics" or "What needs my attention?"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className={cn(
                          "text-white text-xs",
                          getThemeGradient('purple-pink')
                        )}>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isThinking && (
                  <div className="flex gap-2 justify-start">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className={cn(
                        "text-white text-xs",
                        getThemeGradient('purple-pink')
                      )}>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}