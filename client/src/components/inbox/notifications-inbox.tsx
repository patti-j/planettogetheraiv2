import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Inbox, 
  Check, 
  Archive, 
  Trash2, 
  Bell,
  MessageCircle,
  Reply,
  AtSign,
  AlertCircle,
  Info,
  CheckCircle,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  userId: number;
  type: string;
  category: string;
  priority: string;
  sourceType?: string;
  sourceId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  relatedEntityName?: string;
  title: string;
  message: string;
  actionUrl?: string;
  iconType?: string;
  metadata?: {
    commentSnippet?: string;
    authorName?: string;
    authorAvatar?: string;
    contextInfo?: any;
    actionButtons?: Array<{ label: string; action: string; data: any }>;
  };
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

interface NotificationsInboxProps {
  userId?: number;
  showHeader?: boolean;
  maxHeight?: string;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsInbox({
  userId = 1,
  showHeader = true,
  maxHeight = "600px",
  onNotificationClick
}: NotificationsInboxProps) {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread" | "mentions" | "comments">("all");
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/notifications", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === "unread") params.append("unreadOnly", "true");
      if (filter === "mentions") params.append("category", "comment");
      if (filter === "comments") params.append("category", "comment");
      
      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Get unread count
  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/unread-count");
      if (!response.ok) throw new Error("Failed to fetch unread count");
      const data = await response.json();
      return data.count;
    },
    refetchInterval: 30000
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      return await apiRequest("/api/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({ notificationIds })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      setSelectedNotifications(new Set());
      toast({
        title: "Marked as read",
        description: "Selected notifications have been marked as read."
      });
    }
  });

  const handleSelectNotification = (id: number) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotifications(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleMarkSelectedAsRead = () => {
    if (selectedNotifications.size > 0) {
      markAsReadMutation.mutate(Array.from(selectedNotifications));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate([notification.id]);
    }
    
    // Navigate or trigger callback
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case "mention":
        return <AtSign className="h-4 w-4 text-blue-500" />;
      case "reply":
        return <Reply className="h-4 w-4 text-green-500" />;
      case "comment_on_watched":
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "orange";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const renderNotification = (notification: Notification) => {
    const isSelected = selectedNotifications.has(notification.id);
    
    return (
      <div
        key={notification.id}
        className={`
          flex items-start space-x-3 p-3 border-b cursor-pointer
          hover:bg-gray-50 transition-colors
          ${!notification.isRead ? "bg-blue-50/50" : ""}
          ${isSelected ? "bg-blue-100/50" : ""}
        `}
        onClick={() => handleNotificationClick(notification)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleSelectNotification(notification.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
        
        <div className="flex-shrink-0">
          {notification.metadata?.authorAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.metadata.authorAvatar} />
              <AvatarFallback>
                {notification.metadata.authorName?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              {getNotificationIcon(notification)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                  {notification.title}
                </p>
                {notification.priority !== "normal" && (
                  <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                    {notification.priority}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              {notification.metadata?.commentSnippet && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 italic">
                  "{notification.metadata.commentSnippet}"
                </div>
              )}
              
              {notification.relatedEntityName && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {notification.relatedEntityType}: {notification.relatedEntityName}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end ml-2">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              {!notification.isRead && (
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-1" />
              )}
            </div>
          </div>
          
          {notification.metadata?.actionButtons && notification.metadata.actionButtons.length > 0 && (
            <div className="flex space-x-2 mt-2">
              {notification.metadata.actionButtons.map((button, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle action button click
                  }}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Inbox className="h-5 w-5 mr-2" />
                Inbox
                {unreadCount > 0 && (
                  <Badge className="ml-2">{unreadCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Stay updated with mentions, replies, and important notifications
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="border-b px-4 py-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All
                {notifications.length > 0 && (
                  <span className="ml-1 text-xs">({notifications.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs">({unreadCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {selectedNotifications.size > 0 && (
          <div className="border-b px-4 py-2 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedNotifications.size} selected
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkSelectedAsRead}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark as read
              </Button>
              <Button
                size="sm"
                variant="outline"
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            </div>
          </div>
        )}
        
        <ScrollArea style={{ maxHeight }}>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium">You're all caught up!</p>
              <p className="text-sm mt-1">No new notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => renderNotification(notification))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}