import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Mic, Paperclip } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: Action[];
}

interface Action {
  label: string;
  action: string;
  data?: any;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm Max, your AI assistant. I can help you with orders, deliveries, documents, and more. What can I help you with today?",
      timestamp: new Date(),
      suggestions: [
        'Show my recent orders',
        'Upload a document',
        'Check delivery status',
        'Generate a report',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, company, token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/portal/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          context: {
            currentPage: window.location.pathname,
            companyType: company?.type,
            userRole: user?.role,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions,
        actions: data.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Execute any automatic actions
      if (data.actions) {
        executeActions(data.actions);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeActions = async (actions: Action[]) => {
    for (const action of actions) {
      switch (action.action) {
        case 'navigate':
          window.location.href = action.data.url;
          break;
        case 'showToast':
          toast({
            title: action.data.title,
            description: action.data.description,
          });
          break;
        case 'openDialog':
          // Implement dialog opening logic
          break;
        default:
          console.log('Unknown action:', action);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      // Start voice recognition
      setIsListening(true);
      toast({
        title: 'Listening...',
        description: 'Speak your request',
      });
      // Implement actual voice recognition here
      setTimeout(() => setIsListening(false), 3000);
    } else {
      setIsListening(false);
    }
  };

  const handleFileUpload = () => {
    // Implement file upload logic
    toast({
      title: 'File Upload',
      description: 'File upload feature coming soon',
    });
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl transition-all duration-300",
        isExpanded
          ? "inset-4"
          : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh]"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
              <Bot className="w-5 h-5 text-white" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">Max AI Assistant</CardTitle>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(100%-80px)] p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'assistant'
                      ? 'bg-muted'
                      : 'bg-yellow-50 border border-yellow-200'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.suggestions && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleFileUpload}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                isListening && "bg-red-100 border-red-300"
              )}
              onClick={toggleVoiceInput}
            >
              <Mic className={cn("w-4 h-4", isListening && "text-red-600")} />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-10 w-10"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Powered by GPT-4o • {company?.type} Portal
          </p>
        </div>
      </CardContent>
    </Card>
  );
}