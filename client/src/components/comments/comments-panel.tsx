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
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<number[]>([]);
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

  // Fetch users for mentions (only when needed)
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", mentionSearch],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/users?search=${encodeURIComponent(mentionSearch)}&limit=10`, {
        headers,
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: showMentions && mentionSearch.length > 0
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { 
      content: string; 
      parentCommentId?: number;
      mentions?: number[];
    }) => {
      return await apiRequest("POST", "/api/comments", {
        entityType,
        entityId,
        content: data.content,
        parentCommentId: data.parentCommentId,
        mentions: data.mentions
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
      return await apiRequest("PUT", `/api/comments/${commentId}`, { content });
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
      return await apiRequest("DELETE", `/api/comments/${commentId}`);
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
      return await apiRequest("POST", `/api/comments/${commentId}/reactions`, { reactionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
    }
  });

  // Watch thread mutation
  const watchThreadMutation = useMutation({
    mutationFn: async ({ watchType, watchId }: { watchType: string; watchId: number }) => {
      return await apiRequest("POST", "/api/watch", { 
        watchType, 
        watchId,
        entityType: watchType === "entity" ? entityType : undefined
      });
    },
    onSuccess: () => {
      toast({
        title: "Watching thread",
        description: "You'll be notified of new comments."
      });
    }
  });

  // Handle @ mention detection and autocomplete
  const handleTextChange = (value: string, isReply = false) => {
    if (isReply) {
      setNewComment(value);
    } else {
      setNewComment(value);
    }

    // Detect @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    if (mentionMatch) {
      setShowMentions(true);
      setMentionSearch(mentionMatch[1]);
      setCursorPosition(cursorPos);
    } else {
      setShowMentions(false);
      setMentionSearch("");
    }
  };

  const insertMention = (user: any) => {
    const cursorPos = cursorPosition;
    const beforeCursor = newComment.substring(0, cursorPos);
    const afterCursor = newComment.substring(cursorPos);
    
    // Find and replace the @mention text
    const mentionRegex = /@([a-zA-Z0-9_]*)$/;
    const match = beforeCursor.match(mentionRegex);
    
    if (match) {
      const mentionStart = cursorPos - match[0].length;
      const newText = 
        newComment.substring(0, mentionStart) + 
        `@${user.username} ` + 
        afterCursor;
      
      setNewComment(newText);
      setSelectedMentions(prev => [...prev, user.id]);
      setShowMentions(false);
      setMentionSearch("");
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStart + user.username.length + 2; // +2 for "@" and space
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      content: newComment,
      parentCommentId: replyingTo || undefined,
      mentions: selectedMentions.length > 0 ? selectedMentions : undefined
    });
    
    // Reset mentions
    setSelectedMentions([]);
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
                  <div className="mt-3 relative">
                    <Textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => handleTextChange(e.target.value, true)}
                      placeholder={`Reply to ${getAuthorName(comment.author)}... (use @ to mention)`}
                      className="min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          handleSubmitComment();
                        }
                        if (e.key === "Escape") {
                          setShowMentions(false);
                        }
                      }}
                    />
                    
                    {/* Mention autocomplete dropdown for replies */}
                    {showMentions && users.length > 0 && (
                      <div className="absolute z-50 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {users.map((user: any) => (
                          <div
                            key={user.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                            onClick={() => insertMention(user)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                          setSelectedMentions([]);
                          setShowMentions(false);
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
          <div className="mt-4 pt-4 border-t relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Add a comment... (use @ to mention someone)"
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSubmitComment();
                }
                if (e.key === "Escape") {
                  setShowMentions(false);
                }
              }}
            />
            
            {/* Mention autocomplete dropdown */}
            {showMentions && users.length > 0 && (
              <div className="absolute z-50 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => insertMention(user)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (textareaRef.current) {
                      const cursorPos = textareaRef.current.selectionStart;
                      const newText = newComment.substring(0, cursorPos) + "@" + newComment.substring(cursorPos);
                      setNewComment(newText);
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
                          textareaRef.current.focus();
                        }
                      }, 0);
                    }
                  }}
                  title="Add mention"
                >
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Add attachment"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {selectedMentions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedMentions.length} mention{selectedMentions.length > 1 ? 's' : ''}
                  </Badge>
                )}
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}