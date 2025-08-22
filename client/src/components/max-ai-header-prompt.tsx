import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MaxAIHeaderPromptProps {
  showText?: boolean;
}

export function MaxAIHeaderPrompt({ showText = true }: MaxAIHeaderPromptProps) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();



  // Mutation for sending AI prompt
  const sendPromptMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = localStorage.getItem('authToken'); // Fixed: correct token key
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch('/api/max-ai/chat', {
        method: 'POST',
        headers,
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
      toast({
        title: "Max AI Response",
        description: data.content || data.response || 'I understand your request. Let me help you with that.',
      });
      setPrompt('');
    },
    onError: (error) => {
      console.error('Failed to send prompt:', error);
      toast({
        title: "Error",
        description: 'I apologize, but I encountered an error processing your request. Please try again.',
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    
    // Send to AI
    sendPromptMutation.mutate(prompt);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus the input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
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
  );
}