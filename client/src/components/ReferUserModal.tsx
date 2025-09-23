import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Users, Send, UserCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
}

interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  estimatedImpact: string;
  createdAt: string;
  aiAgent: string;
}

interface ReferUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ActionRecommendation;
}

export function ReferUserModal({ isOpen, onClose, recommendation }: ReferUserModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen
  });

  const referMutation = useMutation({
    mutationFn: async (data: { userIds: number[]; message: string; recommendationId: string }) => {
      return apiRequest('POST', '/api/recommendations/refer', data);
    },
    onSuccess: () => {
      toast({
        title: "Referral sent",
        description: `Recommendation referred to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send referral. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedUsers([]);
    setMessage('');
    onClose();
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to refer this recommendation to.",
        variant: "destructive",
      });
      return;
    }

    referMutation.mutate({
      userIds: selectedUsers,
      message: message.trim(),
      recommendationId: recommendation.id,
    });
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Refer Recommendation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {/* Recommendation Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Recommending:</h4>
            <p className="text-sm font-medium">{recommendation.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{recommendation.description}</p>
          </div>

          {/* User Selection */}
          <div className="space-y-3">
            <Label>Select Recipients</Label>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : (
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-4 space-y-2">
                  {(users as User[] || []).map((user: User) => (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                        selectedUsers.includes(user.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted border-border"
                      )}
                      data-testid={`user-option-${user.id}`}
                    >
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={getDisplayName(user)}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                            {getInitials(user)}
                          </div>
                        )}
                        {selectedUsers.includes(user.id) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <UserCheck className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {getDisplayName(user)}
                          </p>
                          {user.jobTitle && (
                            <Badge variant="secondary" className="text-xs">
                              {user.jobTitle}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.department && (
                          <p className="text-xs text-muted-foreground">{user.department}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedUsers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Optional Message</Label>
            <Textarea
              id="message"
              placeholder="Add a note for the recipients (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px]"
              data-testid="referral-message"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="cancel-referral"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0 || referMutation.isPending}
            data-testid="send-referral"
          >
            <Send className="w-4 h-4 mr-2" />
            {referMutation.isPending ? 'Sending...' : 'Send Referral'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}