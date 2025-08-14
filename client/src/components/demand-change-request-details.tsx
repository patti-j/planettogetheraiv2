import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, CheckCircle, X, Clock, User, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DemandChangeRequestDetailsProps {
  requestId: number;
  onBack: () => void;
}

export default function DemandChangeRequestDetails({ requestId, onBack }: DemandChangeRequestDetailsProps) {
  const [newComment, setNewComment] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ["/api/demand-change-requests", requestId],
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/demand-change-requests", requestId, "comments"],
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["/api/demand-change-requests", requestId, "approvals"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { commentText: string; commentType: string; createdBy: number }) => {
      return apiRequest(`/api/demand-change-requests/${requestId}/comments`, {
        method: "POST",
        body: commentData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-change-requests", requestId, "comments"] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added to the request.",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (updateData: { status: string }) => {
      return apiRequest(`/api/demand-change-requests/${requestId}`, {
        method: "PUT",
        body: updateData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/demand-change-requests", requestId] });
      toast({
        title: "Request updated",
        description: "The request status has been updated.",
      });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (approvalData: { approverId: number; approvalRole: string; status: string; comments?: string }) => {
      return apiRequest(`/api/demand-change-requests/${requestId}/approvals`, {
        method: "POST",
        body: {
          ...approvalData,
          orderSequence: 1,
          isRequired: true,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-change-requests", requestId, "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/demand-change-requests", requestId] });
      setApprovalComment("");
      toast({
        title: "Approval recorded",
        description: "Your approval has been recorded.",
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      commentText: newComment,
      commentType: 'general',
      createdBy: 1, // TODO: Get from current user context
    });
  };

  const handleApproval = (status: 'approved' | 'rejected') => {
    approveRequestMutation.mutate({
      approverId: 1, // TODO: Get from current user context
      approvalRole: 'manager', // TODO: Get from current user role
      status,
      comments: approvalComment || undefined,
    });

    // Also update the request status
    updateRequestMutation.mutate({
      status: status === 'approved' ? 'approved' : 'rejected',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "outline";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "under_review": return "bg-yellow-100 text-yellow-800";
      case "submitted": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "implemented": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h1>
          <Button onClick={onBack}>Back to Requests</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{request.requestNumber}</h1>
              <Badge variant={getPriorityColor(request.priority)}>
                {request.priority}
              </Badge>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                <span className="capitalize">{request.status.replace('_', ' ')}</span>
              </div>
            </div>
            <p className="text-gray-600">{request.description}</p>
          </div>
          
          {request.status === 'submitted' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleApproval('rejected')}
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleApproval('approved')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals ({approvals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Request Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type</span>
                        <p className="text-sm capitalize">{request.requestType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Priority</span>
                        <p className="text-sm capitalize">{request.priority}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created</span>
                        <p className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Updated</span>
                        <p className="text-sm">{formatDistanceToNow(new Date(request.updatedAt))} ago</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500">Business Justification</span>
                      <p className="text-sm mt-1">{request.businessJustification}</p>
                    </div>

                    {request.proposedValues && Object.keys(request.proposedValues).length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Proposed Changes</span>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-gray-700">
                            {JSON.stringify(request.proposedValues, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.approvalDeadline && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Approval Deadline</span>
                        <p className="text-sm">{new Date(request.approvalDeadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    {request.implementationDeadline && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Implementation Deadline</span>
                        <p className="text-sm">{new Date(request.implementationDeadline).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {request.status === 'submitted' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Approval Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Add approval comments (optional)..."
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleApproval('approved')}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={approveRequestMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleApproval('rejected')}
                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          disabled={approveRequestMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="impact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Impact Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of potential impacts from this change request
                </CardDescription>
              </CardHeader>
              <CardContent>
                {request.impactAnalysis ? (
                  <div className="space-y-6">
                    {request.impactAnalysis.costImpact && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Cost Impact
                        </h4>
                        <p className="text-lg font-semibold text-green-600">
                          ${request.impactAnalysis.costImpact.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {request.impactAnalysis.resourceImpact && (
                      <div>
                        <h4 className="font-medium">Resource Impact</h4>
                        <p className="text-sm text-gray-700">{request.impactAnalysis.resourceImpact}</p>
                      </div>
                    )}

                    {request.impactAnalysis.timelineImpact && (
                      <div>
                        <h4 className="font-medium">Timeline Impact</h4>
                        <p className="text-sm text-gray-700">{request.impactAnalysis.timelineImpact}</p>
                      </div>
                    )}

                    {request.impactAnalysis.riskAssessment && (
                      <div>
                        <h4 className="font-medium">Risk Assessment</h4>
                        <p className="text-sm text-gray-700">{request.impactAnalysis.riskAssessment}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No impact analysis provided for this request.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Comment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add your comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">User {comment.createdBy}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.commentType}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.commentText}</p>
                    </CardContent>
                  </Card>
                ))}

                {comments.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No comments yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <div className="space-y-4">
              {approvals.map((approval: any) => (
                <Card key={approval.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {approval.approvalRole} (User {approval.approverId})
                        </span>
                        <Badge 
                          variant={approval.status === 'approved' ? 'default' : 'secondary'}
                          className={approval.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {approval.status}
                        </Badge>
                      </div>
                      {approval.approvedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(approval.approvedAt))} ago
                        </span>
                      )}
                    </div>
                    {approval.comments && (
                      <p className="text-sm text-gray-700">{approval.comments}</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {approvals.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No approvals yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}