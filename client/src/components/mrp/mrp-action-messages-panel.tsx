import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Calendar, Package } from "lucide-react";
import { MrpActionMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface MrpActionMessagesPanelProps {
  messages: MrpActionMessage[];
  isLoading: boolean;
}

export function MrpActionMessagesPanel({ messages, isLoading }: MrpActionMessagesPanelProps) {
  const [selectedMessage, setSelectedMessage] = useState<MrpActionMessage | null>(null);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState("");
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: ({ messageId, notes }: { messageId: number; notes: string }) => 
      apiRequest(`/api/mrp/action-messages/${messageId}/acknowledge`, "POST", { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/action-messages"] });
      toast({ title: "Message acknowledged successfully" });
      setShowAcknowledgeDialog(false);
      setSelectedMessage(null);
      setAcknowledgeNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to acknowledge message", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (messageId: number) => 
      apiRequest(`/api/mrp/action-messages/${messageId}/complete`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/action-messages"] });
      toast({ title: "Message marked as completed" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to complete message", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case "expedite":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "de_expedite":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancel":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      case "reschedule":
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case "release":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "firm":
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "acknowledged":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ignored":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    }
  };

  const handleAcknowledge = (message: MrpActionMessage) => {
    setSelectedMessage(message);
    setShowAcknowledgeDialog(true);
  };

  const handleComplete = (messageId: number) => {
    completeMutation.mutate(messageId);
  };

  const handleAcknowledgeSubmit = () => {
    if (selectedMessage) {
      acknowledgeMutation.mutate({
        messageId: selectedMessage.id,
        notes: acknowledgeNotes,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading action messages...</p>
        </CardContent>
      </Card>
    );
  }

  // Group messages by priority
  const groupedMessages = {
    high: messages.filter(msg => msg.priority === "high" && msg.status === "open"),
    medium: messages.filter(msg => msg.priority === "medium" && msg.status === "open"),
    low: messages.filter(msg => msg.priority === "low" && msg.status === "open"),
    acknowledged: messages.filter(msg => msg.status === "acknowledged"),
    completed: messages.filter(msg => msg.status === "completed"),
  };

  return (
    <div className="space-y-6">
      {/* High Priority Messages */}
      {groupedMessages.high.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              High Priority Actions ({groupedMessages.high.length})
            </CardTitle>
            <CardDescription>
              Critical actions that require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageTable 
              messages={groupedMessages.high}
              onAcknowledge={handleAcknowledge}
              onComplete={handleComplete}
              getMessageIcon={getMessageIcon}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </CardContent>
        </Card>
      )}

      {/* Medium Priority Messages */}
      {groupedMessages.medium.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <Clock className="h-5 w-5" />
              Medium Priority Actions ({groupedMessages.medium.length})
            </CardTitle>
            <CardDescription>
              Actions that should be addressed soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageTable 
              messages={groupedMessages.medium}
              onAcknowledge={handleAcknowledge}
              onComplete={handleComplete}
              getMessageIcon={getMessageIcon}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </CardContent>
        </Card>
      )}

      {/* Low Priority Messages */}
      {groupedMessages.low.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Low Priority Actions ({groupedMessages.low.length})
            </CardTitle>
            <CardDescription>
              Informational messages and low priority actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageTable 
              messages={groupedMessages.low}
              onAcknowledge={handleAcknowledge}
              onComplete={handleComplete}
              getMessageIcon={getMessageIcon}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </CardContent>
        </Card>
      )}

      {/* Acknowledged and Completed Messages */}
      {(groupedMessages.acknowledged.length > 0 || groupedMessages.completed.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Processed Messages
            </CardTitle>
            <CardDescription>
              Messages that have been acknowledged or completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageTable 
              messages={[...groupedMessages.acknowledged, ...groupedMessages.completed]}
              onAcknowledge={handleAcknowledge}
              onComplete={handleComplete}
              getMessageIcon={getMessageIcon}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              showActions={false}
            />
          </CardContent>
        </Card>
      )}

      {messages.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No action messages for this MRP run</p>
          </CardContent>
        </Card>
      )}

      {/* Acknowledge Dialog */}
      <Dialog open={showAcknowledgeDialog} onOpenChange={setShowAcknowledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Action Message</DialogTitle>
            <DialogDescription>
              Add notes about how you plan to address this message
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedMessage?.message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Item: {selectedMessage?.itemId} | Type: {selectedMessage?.messageType}
              </p>
            </div>
            
            <Textarea
              placeholder="Add notes about your planned actions..."
              value={acknowledgeNotes}
              onChange={(e) => setAcknowledgeNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcknowledgeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcknowledgeSubmit}
              disabled={acknowledgeMutation.isPending}
            >
              {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MessageTableProps {
  messages: MrpActionMessage[];
  onAcknowledge: (message: MrpActionMessage) => void;
  onComplete: (messageId: number) => void;
  getMessageIcon: (messageType: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  showActions?: boolean;
}

function MessageTable({ 
  messages, 
  onAcknowledge, 
  onComplete, 
  getMessageIcon, 
  getPriorityColor, 
  getStatusColor,
  showActions = true 
}: MessageTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Message</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell>
                <div className="flex items-start gap-3">
                  {getMessageIcon(message.messageType)}
                  <div>
                    <p className="font-medium">{message.message}</p>
                    {message.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{message.notes}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {message.itemId}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {message.messageType.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(message.priority)}>
                  {message.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(message.status)}>
                  {message.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(new Date(message.createdAt))}
                </div>
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {message.status === "open" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAcknowledge(message)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onComplete(message.id)}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}