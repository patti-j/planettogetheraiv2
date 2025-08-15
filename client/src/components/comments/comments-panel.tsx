import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  MessageCircle, 
  Send, 
  MoreVertical, 
  Edit, 
  Trash, 
  Reply,
  ThumbsUp,
  Heart,
  Smile,
  Pin,
  Bell,
  BellOff,
  Paperclip,
  AtSign
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: number;
  entityType: string;
  entityId: number;
  content: string;
  plainTextContent?: string;
  parentCommentId?: number;
  threadRootId?: number;
  threadDepth: number;
  authorId: number;
  author?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  status: string;
  isEdited: boolean;
  editedAt?: Date;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  reactions?: Array<{
    type: string;
    user: {
      id: number;
      username: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  mentions?: Array<{
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  }>;
  attachments?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  repliesCount?: number;
}

interface CommentsPanelProps {
  entityType: string;
  entityId: number;
  entityTitle?: string;
  currentUserId?: number;
  showHeader?: boolean;
  maxHeight?: string;
}

export function CommentsPanel({
  entityType,
  entityId,
  entityTitle,
  currentUserId = 1,
  showHeader = true,
  maxHeight = "600px"
}: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/comments", entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/comments/${entityType}/${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { 
      content: string; 
      parentCommentId?: number;
      mentions?: number[];
    }) => {
      return await apiRequest("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          entityType,
          entityId,
          content: data.content,
          parentCommentId: data.parentCommentId,
          mentions: data.mentions
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      setNewComment("");
      setReplyingTo(null);
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return await apiRequest(`/api/comments/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({ content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully."
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted."
      });
    }
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ commentId, reactionType }: { commentId: number; reactionType: string }) => {
      return await apiRequest(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ reactionType })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
    }
  });

  // Watch thread mutation
  const watchThreadMutation = useMutation({
    mutationFn: async ({ watchType, watchId }: { watchType: string; watchId: number }) => {
      return await apiRequest("/api/watch", {
        method: "POST",
        body: JSON.stringify({ 
          watchType, 
          watchId,
          entityType: watchType === "entity" ? entityType : undefined
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Watching thread",
        description: "You'll be notified of new comments."
      });
    }
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      content: newComment,
      parentCommentId: replyingTo || undefined
    });
  };

  const handleUpdateComment = (commentId: number) => {
    if (!editContent.trim()) return;
    
    updateCommentMutation.mutate({
      commentId,
      content: editContent
    });
  };

  const handleReaction = (commentId: number, reactionType: string) => {
    addReactionMutation.mutate({ commentId, reactionType });
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const getAuthorName = (author?: Comment["author"]) => {
    if (!author) return "Unknown User";
    if (author.firstName || author.lastName) {
      return `${author.firstName || ""} ${author.lastName || ""}`.trim();
    }
    return author.username;
  };

  const getAuthorInitials = (author?: Comment["author"]) => {
    const name = getAuthorName(author);
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const renderComment = (comment: Comment, level = 0) => {
    const isEditing = editingComment === comment.id;
    const isAuthor = comment.authorId === currentUserId;
    
    return (
      <div 
        key={comment.id}
        className={`${level > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""} mb-4`}
      >
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author?.avatar} />
            <AvatarFallback>{getAuthorInitials(comment.author)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">
                  {getAuthorName(comment.author)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <Badge variant="secondary" className="text-xs">edited</Badge>
                )}
                {comment.isPinned && (
                  <Pin className="h-3 w-3 text-primary" />
                )}
              </div>
              
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStartEdit(comment)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex space-x-2 mt-2">
                  <Button 
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
                
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comment.attachments.map(attachment => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-xs text-blue-600 hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>{attachment.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                  
                  <button
                    onClick={() => handleReaction(comment.id, "like")}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>{comment.reactions?.filter(r => r.type === "like").length || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => handleReaction(comment.id, "heart")}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Heart className="h-3 w-3" />
                    <span>{comment.reactions?.filter(r => r.type === "heart").length || 0}</span>
                  </button>
                </div>
                
                {replyingTo === comment.id && (
                  <div className="mt-3">
                    <Textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Reply to ${getAuthorName(comment.author)}...`}
                      className="min-h-[60px]"
                    />
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setNewComment("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {comments
          .filter(c => c.parentCommentId === comment.id)
          .map(reply => renderComment(reply, level + 1))
        }
      </div>
    );
  };

  // Filter root comments (no parent)
  const rootComments = comments.filter(c => !c.parentCommentId && c.status !== "deleted");
  const pinnedComments = rootComments.filter(c => c.isPinned);
  const regularComments = rootComments.filter(c => !c.isPinned);

  return (
    <Card className="h-full">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Comments
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {comments.length}
                  </Badge>
                )}
              </CardTitle>
              {entityTitle && (
                <CardDescription>{entityTitle}</CardDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => watchThreadMutation.mutate({ 
                watchType: "entity", 
                watchId: entityId 
              })}
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-4">
        <ScrollArea className={`pr-4`} style={{ maxHeight }}>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div>
              {/* Pinned comments first */}
              {pinnedComments.map(comment => renderComment(comment))}
              
              {/* Regular comments */}
              {regularComments.map(comment => renderComment(comment))}
            </div>
          )}
        </ScrollArea>
        
        {/* New comment form */}
        {!replyingTo && (
          <div className="mt-4 pt-4 border-t">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSubmitComment();
                }
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMentions(!showMentions)}
                >
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}