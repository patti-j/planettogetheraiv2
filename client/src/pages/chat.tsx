import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Search, 
  Users, 
  Hash, 
  UserPlus,
  Settings,
  Menu,
  ArrowLeft
} from "lucide-react";

interface Channel {
  id: number;
  name: string;
  type: string;
  description?: string;
  isPrivate: boolean;
  createdAt: string;
  lastMessageAt?: string;
  participants: number;
  unreadCount: number;
  lastMessage?: string;
}

interface Message {
  id: number;
  channelId: number;
  senderId: number;
  content: string;
  messageType: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    displayName: string;
  };
  reactions: Record<string, any[]>;
}

export default function Chat() {
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/chat/channels"],
    queryFn: () => apiRequest("GET", "/api/chat/channels").then(res => res.json()),
  });

  // Fetch messages for selected channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chat/channels", selectedChannelId, "messages"],
    queryFn: () => apiRequest("GET", `/api/chat/channels/${selectedChannelId}/messages`).then(res => res.json()),
    enabled: !!selectedChannelId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; messageType?: string }) => 
      apiRequest("POST", `/api/chat/channels/${selectedChannelId}/messages`, data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels", selectedChannelId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      setNewMessage("");
    },
  });

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  // Auto-select first channel if none selected
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const handleChannelSelect = (channelId: number) => {
    setSelectedChannelId(channelId);
    setShowMobileSidebar(false); // Close mobile sidebar when channel is selected
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <MessageCircle className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannelId || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      content: newMessage.trim(),
      messageType: "text",
    });
  };

  const ChannelsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {channelsLoading ? (
            <div className="text-center text-muted-foreground p-4">Loading channels...</div>
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
                  onClick={() => handleChannelSelect(channel.id)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="mt-0.5">
                      {getChannelIcon(channel.type)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{channel.name}</span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {channel.participants} participant{channel.participants !== 1 ? 's' : ''}
                      </p>
                      {channel.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {channel.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Channels List */}
      <div className="hidden md:flex md:w-80 lg:w-96 border-r bg-card">
        <ChannelsList />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-80">
          <ChannelsList />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mobile back button and menu */}
                  <div className="flex items-center space-x-2 md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChannelId(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileSidebar(true)}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {getChannelIcon(selectedChannel.type)}
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">{selectedChannel.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedChannel.participants} participant{selectedChannel.participants !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button variant="ghost" size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground p-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-xs sm:text-sm truncate">
                          {message.sender?.displayName || message.sender?.username || 'Unknown User'}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-3 sm:p-4">
              <div className="flex items-end space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[36px] sm:min-h-[40px] max-h-24 sm:max-h-32 resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="flex-shrink-0"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile header when no channel selected */}
            <div className="md:hidden border-b p-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold ml-12">Messages</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileSidebar(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Empty state */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground max-w-sm">
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">
                  <span className="hidden md:inline">Choose a conversation from the sidebar to start messaging</span>
                  <span className="md:hidden">Tap the menu button to see conversations</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}