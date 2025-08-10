import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  Calendar,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  GitBranch,
  Eye,
  Edit,
  Copy,
  Trash,
  Play,
  Pause,
  BarChart,
  Filter,
  Plus,
  Settings,
  AlertCircle,
  ChevronRight,
  Target,
  TrendingUp,
  Layers,
  Building,
  Package,
  ArrowRight,
  Briefcase,
  UserCheck,
  Bell,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Factory,
  Cpu,
  Zap
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface Schedule {
  id: number;
  scheduleNumber: string;
  name: string;
  description?: string;
  scheduleType: string;
  scheduleLevel: string;
  scopeId?: number;
  scopeType?: string;
  startDate: string;
  endDate: string;
  status: string;
  version: number;
  approvalStatus?: string;
  approvedBy?: number;
  approvedAt?: string;
  isActive: boolean;
  metrics?: any;
  score?: number;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  items?: ScheduleItem[];
  comments?: ScheduleComment[];
}

interface ScheduleItem {
  id: number;
  scheduleId: number;
  itemType: string;
  itemId: number;
  resourceId?: number;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedDuration?: number;
  plannedQuantity?: number;
  status: string;
  priority?: number;
  sequenceNumber?: number;
}

interface ScheduleComment {
  id: number;
  scheduleId: number;
  comment: string;
  commentType?: string;
  userId: number;
  createdAt: string;
  isResolved?: boolean;
}

export default function ScheduleManagement() {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareSchedules, setCompareSchedules] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Fetch schedules
  const { data: schedules = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/schedules', filterStatus, filterLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterLevel !== 'all') params.append('scheduleLevel', filterLevel);
      
      const response = await fetch(`/api/schedules?${params}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    }
  });

  // Fetch selected schedule details
  const { data: scheduleDetails } = useQuery({
    queryKey: ['/api/schedules', selectedSchedule?.id],
    queryFn: async () => {
      if (!selectedSchedule) return null;
      const response = await fetch(`/api/schedules/${selectedSchedule.id}`);
      if (!response.ok) throw new Error('Failed to fetch schedule details');
      return response.json();
    },
    enabled: !!selectedSchedule
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Schedule created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive"
      });
    }
  });

  // Approve schedule mutation
  const approveScheduleMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest('POST', `/api/schedules/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Success",
        description: "Schedule approved successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve schedule",
        variant: "destructive"
      });
    }
  });

  // Activate schedule mutation
  const activateScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('POST', `/api/schedules/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Success",
        description: "Schedule activated for production"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate schedule",
        variant: "destructive"
      });
    }
  });

  // Clone schedule mutation
  const cloneScheduleMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return await apiRequest('POST', `/api/schedules/${id}/clone`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Success",
        description: "Schedule cloned successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clone schedule",
        variant: "destructive"
      });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ scheduleId, comment }: { scheduleId: number; comment: string }) => {
      return await apiRequest('POST', `/api/schedules/${scheduleId}/comments`, { 
        comment,
        commentType: 'general' 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules', selectedSchedule?.id] });
      setNewComment('');
      toast({
        title: "Success",
        description: "Comment added"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  });

  // Compare schedules mutation
  const compareSchedulesMutation = useMutation({
    mutationFn: async (scheduleIds: number[]) => {
      return await apiRequest('POST', '/api/schedules/compare', {
        scheduleIds,
        name: `Comparison ${new Date().toLocaleString()}`,
        comparisonType: 'side_by_side'
      });
    },
    onSuccess: (data) => {
      setShowCompareDialog(false);
      setCompareSchedules([]);
      toast({
        title: "Success",
        description: "Schedule comparison created"
      });
      // You could navigate to a comparison view here
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to compare schedules",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'review': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'archived': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const getScheduleIcon = (level: string) => {
    switch (level) {
      case 'plant': return <Factory className="h-4 w-4" />;
      case 'department': return <Building className="h-4 w-4" />;
      case 'resource': return <Cpu className="h-4 w-4" />;
      case 'work_center': return <Package className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-gray-600 mt-1">
            Create, manage, and collaborate on production schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Level</label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="plant">Plant</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="work_center">Work Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {compareSchedules.length > 0 && (
                <Button
                  onClick={() => compareSchedulesMutation.mutate(compareSchedules)}
                  className="w-full"
                  variant="secondary"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Compare ({compareSchedules.length})
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Schedule List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : schedules.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No schedules found
                    </div>
                  ) : (
                    schedules.map((schedule: Schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSchedule?.id === schedule.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getScheduleIcon(schedule.scheduleLevel)}
                              <span className="font-medium text-sm">
                                {schedule.name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {schedule.scheduleNumber}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={`${getStatusColor(schedule.status)} text-white`}
                              >
                                {schedule.status}
                              </Badge>
                              {schedule.isActive && (
                                <Badge className="bg-blue-500 text-white">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                v{schedule.version}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              {format(new Date(schedule.startDate), 'MMM d')} - 
                              {format(new Date(schedule.endDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <input
                              type="checkbox"
                              checked={compareSchedules.includes(schedule.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCompareSchedules([...compareSchedules, schedule.id]);
                                } else {
                                  setCompareSchedules(compareSchedules.filter(id => id !== schedule.id));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4"
                            />
                            {schedule.score && (
                              <div className="text-xs font-medium">
                                Score: {schedule.score}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Details */}
        <div className="lg:col-span-2">
          {selectedSchedule ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedSchedule.name}</CardTitle>
                    <CardDescription>
                      {selectedSchedule.scheduleNumber} • Version {selectedSchedule.version}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedSchedule.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveScheduleMutation.mutate({ 
                          id: selectedSchedule.id,
                          notes: 'Approved via UI'
                        })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {selectedSchedule.status === 'approved' && !selectedSchedule.isActive && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => activateScheduleMutation.mutate(selectedSchedule.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cloneScheduleMutation.mutate({
                        id: selectedSchedule.id,
                        name: `${selectedSchedule.name} (Copy)`
                      })}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="items">Items</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-sm font-medium capitalize">
                          {selectedSchedule.scheduleType}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Level</label>
                        <p className="text-sm font-medium capitalize">
                          {selectedSchedule.scheduleLevel}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Start Date</label>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedSchedule.startDate), 'PPP')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">End Date</label>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedSchedule.endDate), 'PPP')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge className={`${getStatusColor(selectedSchedule.status)} text-white`}>
                          {selectedSchedule.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Active</label>
                        <Badge variant={selectedSchedule.isActive ? "default" : "secondary"}>
                          {selectedSchedule.isActive ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>

                    {selectedSchedule.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-sm mt-1">{selectedSchedule.description}</p>
                      </div>
                    )}

                    {selectedSchedule.metrics && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Metrics</label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          {Object.entries(selectedSchedule.metrics).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-lg font-semibold">
                                {value as string}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="items" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-3 border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Schedule Items</h3>
                          <Badge>{scheduleDetails?.items?.length || 0} items</Badge>
                        </div>
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="p-3 space-y-2">
                          {scheduleDetails?.items?.map((item: ScheduleItem) => (
                            <div
                              key={item.id}
                              className="p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {item.itemType}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      #{item.itemId}
                                    </span>
                                    {item.priority && (
                                      <Badge className="bg-orange-500 text-white">
                                        P{item.priority}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Resource: {item.resourceId || 'Unassigned'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {format(new Date(item.plannedStartDate), 'MMM d, h:mm a')} - 
                                    {format(new Date(item.plannedEndDate), 'MMM d, h:mm a')}
                                  </div>
                                  {item.plannedQuantity && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Quantity: {item.plannedQuantity}
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  variant={item.status === 'scheduled' ? 'default' : 'secondary'}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-center h-[400px] text-gray-500">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>Timeline visualization would go here</p>
                          <p className="text-sm mt-1">
                            Integrate with Gantt chart or timeline component
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="discussion" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-3 border-b bg-gray-50">
                        <h3 className="font-medium">Comments & Discussion</h3>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="p-3 space-y-3">
                          {scheduleDetails?.comments?.map((comment: ScheduleComment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>U{comment.userId}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-medium">
                                      User {comment.userId}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(comment.createdAt), 'PPp')}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.comment}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-3 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newComment.trim()) {
                                addCommentMutation.mutate({
                                  scheduleId: selectedSchedule.id,
                                  comment: newComment
                                });
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (newComment.trim()) {
                                addCommentMutation.mutate({
                                  scheduleId: selectedSchedule.id,
                                  comment: newComment
                                });
                              }
                            }}
                            disabled={!newComment.trim()}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Select a schedule to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Define the parameters for your new schedule
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createScheduleMutation.mutate({
                name: formData.get('name'),
                description: formData.get('description'),
                scheduleType: formData.get('scheduleType'),
                scheduleLevel: formData.get('scheduleLevel'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                ownerId: 1 // Would come from auth context
              });
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input name="name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select name="scheduleType" defaultValue="production">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="capacity">Capacity</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Level</label>
                  <Select name="scheduleLevel" defaultValue="plant">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plant">Plant</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="work_center">Work Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input name="startDate" type="date" required />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}