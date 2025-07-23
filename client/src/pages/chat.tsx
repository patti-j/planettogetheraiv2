import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Search, 
  Users, 
  Hash, 
  UserPlus,
  Settings
} from "lucide-react";

export default function Chat() {
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for development
  const channels = [
    {
      id: 1,
      name: "General Discussion",
      type: "general",
      participants: 8,
      unreadCount: 3,
      lastMessage: "Meeting starts in 5 minutes"
    },
    {
      id: 2,
      name: "Production Team",
      type: "group",
      participants: 12,
      unreadCount: 0,
      lastMessage: "Shift report uploaded"
    },
    {
      id: 3,
      name: "Quality Control",
      type: "group",
      participants: 6,
      unreadCount: 1,
      lastMessage: "Inspection results ready"
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "John Smith",
      content: "Good morning everyone! Ready for today's production goals?",
      timestamp: "9:15 AM",
      avatar: null
    },
    {
      id: 2,
      sender: "Sarah Johnson",
      content: "Yes, we're on track. Line 2 is running smoothly.",
      timestamp: "9:18 AM",
      avatar: null
    },
    {
      id: 3,
      sender: "Mike Wilson",
      content: "Quality metrics looking good this morning.",
      timestamp: "9:22 AM",
      avatar: null
    }
  ];

  const [selectedChannelId, setSelectedChannelId] = useState(1);
  const selectedChannel = channels.find(c => c.id === selectedChannelId);

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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send the message to the API
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Channels List */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-semibold md:ml-0 ml-12">Messages</h2>
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
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {channels
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
                    </div>
                  </div>
                </Button>
              ))}
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
                  {getChannelIcon(selectedChannel.type)}
                  <div>
                    <h3 className="font-semibold md:text-lg md:ml-0 ml-12">{selectedChannel.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground md:ml-0 ml-12">
                      {selectedChannel.participants} participant{selectedChannel.participants !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
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
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{message.sender}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm mt-1">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-end space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-32 resize-none"
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
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}