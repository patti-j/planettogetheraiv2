import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Search, 
  Users, 
  Hash, 
  UserPlus,
  Settings,
  Smile,
  Edit,
  Trash2,
  Languages,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Channel {
  id: number;
  name: string;
  description?: string;
  type: "direct" | "group" | "general";
  isPrivate: boolean;
  objectType?: string;
  objectId?: number;
  participants: Participant[];
  createdAt: string;
  unreadCount?: number;
}

interface Participant {
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "member" | "admin";
  joinedAt: string;
}

interface Message {
  id: number;
  content: string;
  originalLanguage?: string;
  translations?: Record<string, string>;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  channelId: number;
  messageType: "text" | "file" | "system";
  parentMessageId?: number;
  editedAt?: string;
  reactions: Reaction[];
  createdAt: string;
}

interface Reaction {
  id: number;
  emoji: string;
  userId: number;
  username: string;
}

interface Language {
  code: string;
  name: string;
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [languageSettingsOpen, setLanguageSettingsOpen] = useState(false);
  const [translatingMessages, setTranslatingMessages] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ['/api/chat/channels'],
  });

  // Fetch messages for selected channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/chat/channels', selectedChannelId, 'messages'],
    enabled: !!selectedChannelId,
  });

  // Get user preferences for language settings
  const { data: userPreferences } = useQuery({
    queryKey: ["/api/user/preferences"],
  });

  // Get available languages for translation
  const { data: availableLanguages = [] } = useQuery<Language[]>({
    queryKey: ["/api/chat/languages"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { channelId: number; content: string; messageType?: string }) => {
      return apiRequest('POST', `/api/chat/channels/${data.channelId}/messages`, data);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chat/channels', selectedChannelId, 'messages'] });
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (channelData: any) => {
      return apiRequest('POST', '/api/chat/channels', channelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/channels'] });
      setShowCreateChannel(false);
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to create channel",
        variant: "destructive",
      });
    },
  });

  // Translation mutation
  const translateMessageMutation = useMutation({
    mutationFn: async ({ messageId, targetLanguage }: { messageId: number; targetLanguage: string }) => {
      return apiRequest('POST', `/api/chat/messages/${messageId}/translate`, { targetLanguage });
    },
    onMutate: ({ messageId }) => {
      setTranslatingMessages(prev => new Set([...prev, messageId]));
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat/channels', selectedChannelId, 'messages'] 
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Translation Error",
        description: "Failed to translate message",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      setTranslatingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.messageId);
        return newSet;
      });
    }
  });

  // Update language preference mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async ({ language }: { language: string }) => {
      return apiRequest('PUT', `/api/user/preferences`, { language });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
      toast({
        title: "Success",
        description: "Language preference updated!",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update language preference",
        variant: "destructive",
      });
    }
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select first channel if none selected
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannelId) return;
    
    sendMessageMutation.mutate({
      channelId: selectedChannelId,
      content: newMessage.trim(),
      messageType: "text"
    });
  };

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case "direct":
        return <MessageCircle className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Channels List */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold md:ml-0 ml-3">Messages</h2>
            <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <CreateChannelDialog 
                onSubmit={createChannelMutation.mutate}
                isLoading={createChannelMutation.isPending}
              />
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {channelsLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading channels...</div>
            ) : channels.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
            ) : (
              channels
                .filter(channel => 
                  !searchQuery || 
                  channel.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannelId === channel.id ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="mt-0.5">
                        {getChannelIcon(channel)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{channel.name}</span>
                          {channel.unreadCount && (
                            <Badge variant="destructive" className="text-xs">
                              {channel.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {channel.participants.length} participant{channel.participants.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(selectedChannel)}
                  <div>
                    <h3 className="font-semibold md:ml-0 ml-3">{selectedChannel.name}</h3>
                    <p className="text-sm text-muted-foreground md:ml-0 ml-3">
                      {selectedChannel.participants.length} participant{selectedChannel.participants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setLanguageSettingsOpen(true)}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-sm text-muted-foreground">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.createdAt)}
                          </span>
                          {message.editedAt && (
                            <span className="text-xs text-muted-foreground">(edited)</span>
                          )}
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-sm">{message.content}</p>
                          
                          {/* Show translation if available */}
                          {userPreferences?.language && 
                           message.translations?.[userPreferences.language] && 
                           message.originalLanguage !== userPreferences.language && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r">
                              <div className="flex items-center gap-1 mb-1">
                                <Languages className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600 font-medium">Translated</span>
                              </div>
                              <p className="text-sm">{message.translations[userPreferences.language]}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            {/* Message actions */}
                            <div className="flex items-center gap-1">
                              {userPreferences?.language && 
                               message.originalLanguage !== userPreferences.language &&
                               !message.translations?.[userPreferences.language] && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => translateMessageMutation.mutate({
                                          messageId: message.id,
                                          targetLanguage: userPreferences.language
                                        })}
                                        disabled={translatingMessages.has(message.id)}
                                      >
                                        {translatingMessages.has(message.id) ? (
                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                        ) : (
                                          <Languages className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Translate to {availableLanguages.find(l => l.code === userPreferences.language)?.name || userPreferences.language}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            
                            {/* Reactions */}
                            {message.reactions.length > 0 && (
                              <div className="flex gap-1">
                                {message.reactions.reduce((acc: any[], reaction) => {
                                  const existing = acc.find(r => r.emoji === reaction.emoji);
                                  if (existing) {
                                    existing.count++;
                                    existing.users.push(reaction.username);
                                  } else {
                                    acc.push({ 
                                      emoji: reaction.emoji, 
                                      count: 1, 
                                      users: [reaction.username] 
                                    });
                                  }
                                  return acc;
                                }, []).map((reaction, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                  >
                                    {reaction.emoji} {reaction.count}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[40px] max-h-32 resize-none"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a conversation from the sidebar to start messaging
              </p>
              <Button onClick={() => setShowCreateChannel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Language Settings Dialog */}
      <Dialog open={languageSettingsOpen} onOpenChange={setLanguageSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Language Preferences</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Preferred Language for Chat Messages
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Messages in other languages will show translation buttons
              </p>
              
              <Select
                value={userPreferences?.language || "en"}
                onValueChange={(language) => updateLanguageMutation.mutate({ language })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Languages className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    How Translation Works
                  </p>
                  <ul className="text-blue-700 dark:text-blue-200 space-y-1 text-xs">
                    <li>• Click translate button on messages in other languages</li>
                    <li>• Translations are cached for faster access</li>
                    <li>• Original message is always preserved</li>
                    <li>• AI-powered translation using OpenAI</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setLanguageSettingsOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateChannelDialog({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "group" as "direct" | "group" | "general",
    isPrivate: false,
    objectType: "",
    objectId: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSubmit({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      isPrivate: formData.isPrivate,
      contextType: formData.objectType === "none" ? null : formData.objectType || null,
      contextId: formData.objectId ? parseInt(formData.objectId) : null
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Conversation</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Conversation Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter conversation name"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this conversation is about"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Type</label>
          <Select 
            value={formData.type} 
            onValueChange={(value: "direct" | "group" | "general") => 
              setFormData(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct Message</SelectItem>
              <SelectItem value="group">Group Chat</SelectItem>
              <SelectItem value="general">General Discussion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Related to (Optional)</label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={formData.objectType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, objectType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="job">Job/Order</SelectItem>
                <SelectItem value="operation">Operation</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
            
            {formData.objectType && formData.objectType !== "none" && (
              <Input
                type="number"
                value={formData.objectId}
                onChange={(e) => setFormData(prev => ({ ...prev, objectId: e.target.value }))}
                placeholder="ID"
              />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPrivate"
            checked={formData.isPrivate}
            onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isPrivate" className="text-sm">Private conversation</label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit" disabled={isLoading || !formData.name.trim()}>
            {isLoading ? "Creating..." : "Create Conversation"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}