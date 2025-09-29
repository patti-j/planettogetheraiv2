import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, ChevronDown, History, MessageSquare, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useChatSync } from '@/hooks/useChatSync';

interface MaxAIHeaderPromptProps {
  showText?: boolean;
}

export function MaxAIHeaderPrompt({ showText = true }: MaxAIHeaderPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { addMessage, chatMessages } = useChatSync();

  // Load prompt history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('maxai-prompt-history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setPromptHistory(history);
        setFilteredPrompts(history);
      } catch (error) {
        console.error('Failed to parse prompt history:', error);
      }
    }
  }, []);

  // Save prompt to history
  const savePromptToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    
    setPromptHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt.trim());
      const updated = [newPrompt.trim(), ...filtered].slice(0, 10); // Keep only last 10 prompts
      localStorage.setItem('maxai-prompt-history', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter prompts based on current input
  useEffect(() => {
    if (!prompt.trim()) {
      setFilteredPrompts(promptHistory);
    } else {
      const filtered = promptHistory.filter(p => 
        p.toLowerCase().includes(prompt.toLowerCase())
      );
      setFilteredPrompts(filtered);
    }
  }, [prompt, promptHistory]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);



  // Mutation for sending AI prompt
  const sendPromptMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = localStorage.getItem('auth_token'); // Fixed: correct token key
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
      // Save prompt to history
      savePromptToHistory(prompt);
      
      // Add user message to chat panel
      addMessage({
        role: 'user',
        content: prompt,
        source: 'header'
      });

      // Add AI response to chat panel
      const responseContent = data.content || data.response || 'I understand your request. Let me help you with that.';
      addMessage({
        role: 'assistant', 
        content: responseContent,
        source: 'header'
      });
      
      // Handle navigation actions
      if (data.action?.type === 'navigate' && data.action.target) {
        // Navigate to the target page
        window.location.href = data.action.target;
        toast({
          title: "Max AI",
          description: data.content || `Navigating to ${data.action.target.replace('/', '').replace('-', ' ')}...`,
        });
      } else {
        // Show regular response
        toast({
          title: "Max AI Response",
          description: responseContent,
        });
      }
      setPrompt('');
      setShowDropdown(false);
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

  const handleInputClick = () => {
    console.log('Input clicked, showing dropdown');
    setShowDropdown(true);
  };

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (!showDropdown) {
      console.log('Showing dropdown from input change');
      setShowDropdown(true);
    }
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
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      <Sparkles className="h-4 w-4 text-muted-foreground" />
      <form onSubmit={handleSubmit} className="relative flex items-center gap-1">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask anything... (⌘K)"
            value={prompt}
            onChange={handleInputChange}
            onClick={handleInputClick}
            className={cn(
              "h-8 transition-all duration-200 pr-6",
              showText ? "w-48 lg:w-64" : "w-32 lg:w-48",
              "placeholder:text-xs"
            )}
          />
          <ChevronDown 
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground transition-transform",
              showDropdown && "rotate-180"
            )}
          />
          
          {/* Dropdown */}
          {showDropdown && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[9999] max-h-80 overflow-y-auto"
              style={{ minWidth: '320px', width: 'max-content' }}
            >
              {/* Chat History Section */}
              {chatMessages.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-600">
                  <div className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                    Recent Conversation
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {chatMessages.slice(-6).map((message, index) => (
                      <div
                        key={message.id}
                        className="px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handlePromptSelect(message.content)}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'user' ? (
                            <User className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {message.role === 'user' ? 'You' : 'Max AI'}
                            </div>
                            <div className="text-xs leading-relaxed text-gray-900 dark:text-gray-100 line-clamp-3">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt History Section */}
              {filteredPrompts.length > 0 ? (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                    Recent Prompts
                  </div>
                  {filteredPrompts.slice(0, 5).map((historyPrompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePromptSelect(historyPrompt)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <History className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="truncate text-gray-900 dark:text-gray-100">{historyPrompt}</span>
                    </button>
                  ))}
                </div>
              ) : chatMessages.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No conversation history yet. Start by asking Max AI a question!
                </div>
              )}
            </div>
          )}
        </div>
        
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