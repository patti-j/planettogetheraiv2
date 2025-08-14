import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Users, Clock, MapPin, Video, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function DemandCollaborationSessions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/demand-collaboration-sessions"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return apiRequest("/api/demand-collaboration-sessions", {
        method: "POST",
        body: sessionData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-collaboration-sessions"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Session created",
        description: "Collaboration session has been scheduled successfully.",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, ...sessionData }: any) => {
      return apiRequest(`/api/demand-collaboration-sessions/${id}`, {
        method: "PUT",
        body: sessionData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-collaboration-sessions"] });
      setEditingSession(null);
      toast({
        title: "Session updated",
        description: "Collaboration session has been updated successfully.",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/demand-collaboration-sessions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-collaboration-sessions"] });
      toast({
        title: "Session deleted",
        description: "Collaboration session has been deleted.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "postponed": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "review": return <Clock className="h-4 w-4" />;
      case "planning": return <Calendar className="h-4 w-4" />;
      case "crisis": return <Badge className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const SessionForm = ({ session, onCancel }: { session?: any; onCancel: () => void }) => {
    const [formData, setFormData] = useState({
      sessionName: session?.sessionName || "",
      description: session?.description || "",
      organizer: session?.organizer || 1, // TODO: Get from current user
      scheduledStart: session?.scheduledStart ? new Date(session.scheduledStart).toISOString().slice(0, 16) : "",
      scheduledEnd: session?.scheduledEnd ? new Date(session.scheduledEnd).toISOString().slice(0, 16) : "",
      meetingType: session?.meetingType || "review",
      status: session?.status || "scheduled",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const sessionData = {
        ...formData,
        scheduledStart: new Date(formData.scheduledStart).toISOString(),
        scheduledEnd: new Date(formData.scheduledEnd).toISOString(),
        participants: [], // TODO: Add participant selection
        relatedChangeRequests: [], // TODO: Add change request linking
      };

      if (session) {
        updateSessionMutation.mutate({ id: session.id, ...sessionData });
      } else {
        createSessionMutation.mutate(sessionData);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="sessionName">Session Name</Label>
          <Input
            id="sessionName"
            value={formData.sessionName}
            onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
            placeholder="Enter session name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the purpose of this session"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="meetingType">Meeting Type</Label>
            <Select value={formData.meetingType} onValueChange={(value) => setFormData({ ...formData, meetingType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review">Review Session</SelectItem>
                <SelectItem value="planning">Planning Session</SelectItem>
                <SelectItem value="crisis">Crisis Management</SelectItem>
                <SelectItem value="adjustment">Demand Adjustment</SelectItem>
                <SelectItem value="forecast_sync">Forecast Sync</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scheduledStart">Start Time</Label>
            <Input
              id="scheduledStart"
              type="datetime-local"
              value={formData.scheduledStart}
              onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="scheduledEnd">End Time</Label>
            <Input
              id="scheduledEnd"
              type="datetime-local"
              value={formData.scheduledEnd}
              onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createSessionMutation.isPending || updateSessionMutation.isPending}>
            {session ? "Update Session" : "Create Session"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collaboration Sessions</h2>
          <p className="text-gray-600">Schedule and manage demand planning meetings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Session</DialogTitle>
              <DialogDescription>
                Create a new collaboration session for demand planning
              </DialogDescription>
            </DialogHeader>
            <SessionForm onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
          {sessions.map((session: any) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {getMeetingTypeIcon(session.meetingType)}
                    {session.sessionName}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSession(session)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSessionMutation.mutate(session.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {session.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(session.status)}`}>
                      <span className="capitalize">{session.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {session.meetingType.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span>{new Date(session.scheduledStart).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span>
                        {new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(session.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      Organized by User {session.organizer}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && sessions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No sessions scheduled
            </h3>
            <p className="text-gray-600 mb-4">
              Schedule your first collaboration session to coordinate demand planning activities.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Schedule Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Session Dialog */}
      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update the collaboration session details
              </DialogDescription>
            </DialogHeader>
            <SessionForm 
              session={editingSession} 
              onCancel={() => setEditingSession(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}