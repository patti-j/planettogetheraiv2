import { useState } from "react";
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

export default function Chat() {
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

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

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send the message to the API
    console.log("Sending message:", newMessage);
    setNewMessage("");
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
                  </div>
                </div>
              </Button>
            ))}
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
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-2 sm:space-x-3">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarImage src={message.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-xs sm:text-sm truncate">{message.sender}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{message.timestamp}</span>
                      </div>
                      <p className="text-sm mt-1 break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
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
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
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