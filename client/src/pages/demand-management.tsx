import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, CheckCircle, Clock, AlertTriangle, Users, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DemandChangeRequestForm from "@/components/demand-change-request-form";
import DemandChangeRequestDetails from "@/components/demand-change-request-details";
import DemandCollaborationSessions from "@/components/demand-collaboration-sessions";

export default function DemandManagement() {
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/demand-change-requests"],
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "under_review": return <Clock className="h-4 w-4" />;
      case "rejected": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (selectedRequest && !showNewRequestForm) {
    return (
      <DemandChangeRequestDetails
        requestId={selectedRequest}
        onBack={() => setSelectedRequest(null)}
      />
    );
  }

  if (showNewRequestForm) {
    return (
      <DemandChangeRequestForm
        onCancel={() => setShowNewRequestForm(false)}
        onSuccess={(id) => {
          setShowNewRequestForm(false);
          setSelectedRequest(id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Demand Management</h1>
            <p className="text-gray-600 mt-1">
              Collaborative demand planning and change management
            </p>
          </div>
          <Button onClick={() => setShowNewRequestForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Change Request
          </Button>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Change Requests
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((request: any) => (
                  <Card 
                    key={request.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedRequest(request.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                          {request.requestNumber}
                        </CardTitle>
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {request.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Type:</span>
                          <Badge variant="outline" className="capitalize">
                            {request.requestType.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {request.approvalDeadline && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Due:</span>
                            <span className="text-sm font-medium">
                              {new Date(request.approvalDeadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <span className="text-xs text-gray-500">
                            Created {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && requests.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No change requests yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first demand change request to get started with collaborative planning.
                  </p>
                  <Button onClick={() => setShowNewRequestForm(true)}>
                    Create Change Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collaboration">
            <DemandCollaborationSessions />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Demand Analytics Dashboard</CardTitle>
                <CardDescription>
                  Analytics and insights for demand management performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analytics Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Comprehensive analytics and reporting features will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}