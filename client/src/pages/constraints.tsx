import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Shield,
  TrendingUp,
  AlertCircle,
  Play,
  Clock,
  Package,
  Factory,
  Activity,
  BarChart3,
  History,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  Zap
} from "lucide-react";

// Types for TOC entities
interface DrumResource {
  id: number;
  resourceId: number;
  resourceName: string;
  isDrum: boolean;
  isManual: boolean;
  drumType: 'primary' | 'secondary' | 'potential';
  designatedAt: string;
  designatedBy: number;
  reason?: string;
  utilization?: number;
}

interface DrumAnalysisHistory {
  id: number;
  analysisDate: string;
  analyzedBy: number;
  drumResourceId: number | null;
  resourceName: string | null;
  bottleneckScore: number | null;
  utilizationPercent: number | null;
  operationCount: number | null;
  totalDuration: number | null;
  analysisType: 'manual' | 'automated';
  recommendations?: string;
}

interface Buffer {
  id: number;
  name: string;
  type: 'time' | 'stock';
  category: 'drum' | 'feeding' | 'shipping' | 'stock' | 'space' | 'capacity';
  targetSize: number;
  currentSize: number;
  uom: string;
  redZone: number;
  yellowZone: number;
  greenZone: number;
  location?: string;
  resourceId?: number;
  itemId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  resourceName?: string;
  itemName?: string;
  penetration?: number;
  zone?: 'red' | 'yellow' | 'green';
}

interface BufferConsumption {
  id: number;
  bufferId: number;
  consumptionDate: string;
  consumedAmount: number;
  remainingAmount: number;
  penetrationPercent: number;
  zone: 'red' | 'yellow' | 'green';
  reason?: string;
  actionTaken?: string;
  jobId?: number;
  operationId?: number;
  createdBy: number;
}

// Form schemas
const bufferFormSchema = z.object({
  name: z.string().min(1, "Buffer name is required"),
  type: z.enum(["time", "stock"]),
  category: z.enum(["drum", "feeding", "shipping", "stock", "space", "capacity"]),
  targetSize: z.number().positive("Target size must be positive"),
  currentSize: z.number().min(0, "Current size cannot be negative"),
  uom: z.string().min(1, "Unit of measure is required"),
  redZone: z.number().min(0).max(100, "Red zone must be between 0-100%"),
  yellowZone: z.number().min(0).max(100, "Yellow zone must be between 0-100%"),
  greenZone: z.number().min(0).max(100, "Green zone must be between 0-100%"),
  location: z.string().optional(),
  resourceId: z.number().optional(),
  itemId: z.number().optional(),
  isActive: z.boolean().default(true)
});

const drumDesignationSchema = z.object({
  resourceId: z.number().positive("Resource is required"),
  drumType: z.enum(["primary", "secondary", "potential"]),
  reason: z.string().optional()
});

export default function ConstraintsManagement() {
  const [selectedTab, setSelectedTab] = useState("drums");
  const [isBufferDialogOpen, setIsBufferDialogOpen] = useState(false);
  const [editingBuffer, setEditingBuffer] = useState<Buffer | null>(null);
  const [isDrumDialogOpen, setIsDrumDialogOpen] = useState(false);
  const { toast } = useToast();

  // Queries
  const { data: drums = [], isLoading: drumsLoading } = useQuery<DrumResource[]>({
    queryKey: ["/api/toc/drums"],
    enabled: selectedTab === "drums"
  });

  const { data: drumHistory = [], isLoading: historyLoading } = useQuery<DrumAnalysisHistory[]>({
    queryKey: ["/api/toc/drums/history"],
    enabled: selectedTab === "drums"
  });

  const { data: buffers = [], isLoading: buffersLoading } = useQuery<Buffer[]>({
    queryKey: ["/api/toc/buffers"],
    enabled: selectedTab === "buffers"
  });

  const { data: resources = [] } = useQuery<any[]>({
    queryKey: ["/api/resources"]
  });

  const { data: items = [] } = useQuery<any[]>({
    queryKey: ["/api/items"]
  });

  // Mutations
  const drumAnalysisMutation = useMutation({
    mutationFn: () => apiRequest("/api/toc/drums/analyze", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toc/drums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toc/drums/history"] });
      toast({
        title: "Analysis Complete",
        description: "Drum analysis has been completed successfully"
      });
    }
  });

  const drumDesignationMutation = useMutation({
    mutationFn: (data: z.infer<typeof drumDesignationSchema>) => 
      apiRequest("/api/toc/drums/designate", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toc/drums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toc/drums/history"] });
      setIsDrumDialogOpen(false);
      toast({
        title: "Drum Designated",
        description: "Resource has been designated as a drum"
      });
    }
  });

  const bufferMutation = useMutation({
    mutationFn: (data: z.infer<typeof bufferFormSchema> & { id?: number }) => {
      if (data.id) {
        return apiRequest(`/api/toc/buffers/${data.id}`, "PATCH", data);
      }
      return apiRequest("/api/toc/buffers", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toc/buffers"] });
      setIsBufferDialogOpen(false);
      setEditingBuffer(null);
      toast({
        title: editingBuffer ? "Buffer Updated" : "Buffer Created",
        description: "Buffer has been saved successfully"
      });
    }
  });

  const deleteBufferMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/toc/buffers/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toc/buffers"] });
      toast({
        title: "Buffer Deleted",
        description: "Buffer has been deleted successfully"
      });
    }
  });

  // Forms
  const bufferForm = useForm<z.infer<typeof bufferFormSchema>>({
    resolver: zodResolver(bufferFormSchema),
    defaultValues: {
      name: "",
      type: "time",
      category: "feeding",
      targetSize: 100,
      currentSize: 100,
      uom: "hours",
      redZone: 33,
      yellowZone: 33,
      greenZone: 34,
      isActive: true
    }
  });

  const drumForm = useForm<z.infer<typeof drumDesignationSchema>>({
    resolver: zodResolver(drumDesignationSchema),
    defaultValues: {
      drumType: "primary"
    }
  });

  // Reset form when editing buffer changes
  useEffect(() => {
    if (editingBuffer) {
      bufferForm.reset({
        name: editingBuffer.name,
        type: editingBuffer.type,
        category: editingBuffer.category,
        targetSize: editingBuffer.targetSize,
        currentSize: editingBuffer.currentSize,
        uom: editingBuffer.uom,
        redZone: editingBuffer.redZone,
        yellowZone: editingBuffer.yellowZone,
        greenZone: editingBuffer.greenZone,
        location: editingBuffer.location,
        resourceId: editingBuffer.resourceId,
        itemId: editingBuffer.itemId,
        isActive: editingBuffer.isActive
      });
    } else {
      bufferForm.reset();
    }
  }, [editingBuffer, bufferForm]);

  const onSubmitBuffer = (data: z.infer<typeof bufferFormSchema>) => {
    bufferMutation.mutate({
      ...data,
      id: editingBuffer?.id
    });
  };

  const onSubmitDrum = (data: z.infer<typeof drumDesignationSchema>) => {
    drumDesignationMutation.mutate(data);
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDrumTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-purple-500';
      case 'secondary': return 'bg-blue-500';
      case 'potential': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Theory of Constraints Management</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Manage drums, buffers, and optimize your production constraints
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => drumAnalysisMutation.mutate()}
            disabled={drumAnalysisMutation.isPending}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            {drumAnalysisMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Run Drum Analysis</span>
            <span className="sm:hidden">Analyze</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="drums" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Drum Management</span>
            <span className="sm:hidden">Drums</span>
          </TabsTrigger>
          <TabsTrigger value="buffers" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Buffer Management</span>
            <span className="sm:hidden">Buffers</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">TOC Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Drums Tab */}
        <TabsContent value="drums" className="space-y-4">
          <div className="grid gap-4">
            {/* Current Drums */}
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Current Drum Resources</CardTitle>
                <Dialog open={isDrumDialogOpen} onOpenChange={setIsDrumDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Designate Drum</span>
                      <span className="sm:hidden">Add Drum</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Designate Resource as Drum</DialogTitle>
                    </DialogHeader>
                    <Form {...drumForm}>
                      <form onSubmit={drumForm.handleSubmit(onSubmitDrum)} className="space-y-4">
                        <FormField
                          control={drumForm.control}
                          name="resourceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resource</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a resource" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {resources.map((resource: any) => (
                                    <SelectItem key={resource.id} value={resource.id.toString()}>
                                      {resource.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={drumForm.control}
                          name="drumType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Drum Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="primary">Primary</SelectItem>
                                  <SelectItem value="secondary">Secondary</SelectItem>
                                  <SelectItem value="potential">Potential</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={drumForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason (Optional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Reason for designation..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsDrumDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={drumDesignationMutation.isPending}>
                            {drumDesignationMutation.isPending ? "Saving..." : "Designate"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {drumsLoading ? (
                  <div className="text-center py-4">Loading drums...</div>
                ) : drums.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No drum resources designated. Run analysis or manually designate resources.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {drums.map((drum: DrumResource) => (
                      <div key={drum.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Factory className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{drum.resourceName}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className={`${getDrumTypeColor(drum.drumType)} text-white`}>
                                {drum.drumType}
                              </Badge>
                              {drum.isManual && (
                                <Badge variant="outline">Manual</Badge>
                              )}
                              {drum.utilization && (
                                <span className="text-sm text-gray-500">
                                  {drum.utilization.toFixed(1)}% util
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 sm:text-right">
                          <span className="sm:hidden">Designated: </span>
                          {format(new Date(drum.designatedAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis History */}
            <Card>
              <CardHeader>
                <CardTitle>Drum Analysis History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-4">Loading history...</div>
                ) : drumHistory.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No analysis history available. Run your first analysis to identify bottlenecks.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {/* Mobile-friendly cards for small screens, table for larger screens */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>Bottleneck Score</TableHead>
                            <TableHead>Utilization</TableHead>
                            <TableHead>Operations</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {drumHistory.map((history: DrumAnalysisHistory) => (
                            <TableRow key={history.id}>
                              <TableCell>
                                {format(new Date(history.analysisDate), 'MMM d, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>{history.resourceName || 'N/A'}</TableCell>
                              <TableCell>
                                {history.bottleneckScore ? (
                                  <Badge variant={history.bottleneckScore > 80 ? "destructive" : "default"}>
                                    {history.bottleneckScore.toFixed(1)}
                                  </Badge>
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {history.utilizationPercent ? `${history.utilizationPercent.toFixed(1)}%` : 'N/A'}
                              </TableCell>
                              <TableCell>{history.operationCount || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={history.analysisType === 'automated' ? "default" : "outline"}>
                                  {history.analysisType}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Mobile card view */}
                    <div className="sm:hidden space-y-3">
                      {drumHistory.map((history: DrumAnalysisHistory) => (
                        <div key={history.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{history.resourceName || 'N/A'}</div>
                            <Badge variant={history.analysisType === 'automated' ? "default" : "outline"}>
                              {history.analysisType}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {format(new Date(history.analysisDate), 'MMM d, yyyy HH:mm')}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Score: </span>
                              {history.bottleneckScore ? (
                                <Badge variant={history.bottleneckScore > 80 ? "destructive" : "default"}>
                                  {history.bottleneckScore.toFixed(1)}
                                </Badge>
                              ) : 'N/A'}
                            </div>
                            <div>
                              <span className="text-gray-500">Util: </span>
                              {history.utilizationPercent ? `${history.utilizationPercent.toFixed(1)}%` : 'N/A'}
                            </div>
                            <div>
                              <span className="text-gray-500">Ops: </span>
                              {history.operationCount || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Buffers Tab */}
        <TabsContent value="buffers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Buffer Management</CardTitle>
              <Button size="sm" onClick={() => {
                setEditingBuffer(null);
                setIsBufferDialogOpen(true);
              }} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Buffer
              </Button>
            </CardHeader>
            <CardContent>
              {buffersLoading ? (
                <div className="text-center py-4">Loading buffers...</div>
              ) : buffers.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No buffers configured. Create buffers to protect your constraints.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {buffers.map((buffer: Buffer) => (
                    <Card key={buffer.id} className="relative">
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{buffer.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {buffer.type === 'time' ? <Clock className="w-3 h-3 mr-1" /> : <Package className="w-3 h-3 mr-1" />}
                                {buffer.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{buffer.category}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 sm:flex-col">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingBuffer(buffer);
                                setIsBufferDialogOpen(true);
                              }}
                              className="p-2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteBufferMutation.mutate(buffer.id)}
                              className="p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Buffer Status</span>
                              <span>{buffer.currentSize} / {buffer.targetSize} {buffer.uom}</span>
                            </div>
                            <Progress value={(buffer.currentSize / buffer.targetSize) * 100} />
                          </div>

                          {buffer.penetration !== undefined && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Penetration</span>
                                <span>{buffer.penetration.toFixed(1)}%</span>
                              </div>
                              <div className="flex h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500" style={{ width: `${buffer.greenZone}%` }} />
                                <div className="bg-yellow-500" style={{ width: `${buffer.yellowZone}%` }} />
                                <div className="bg-red-500" style={{ width: `${buffer.redZone}%` }} />
                              </div>
                              {buffer.zone && (
                                <Badge className={`mt-2 ${getZoneColor(buffer.zone)}`}>
                                  {buffer.zone.toUpperCase()} Zone
                                </Badge>
                              )}
                            </div>
                          )}

                          {buffer.resourceName && (
                            <p className="text-sm text-gray-500">Resource: {buffer.resourceName}</p>
                          )}
                          {buffer.itemName && (
                            <p className="text-sm text-gray-500">Item: {buffer.itemName}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buffer Dialog */}
          <Dialog open={isBufferDialogOpen} onOpenChange={setIsBufferDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingBuffer ? 'Edit Buffer' : 'Create New Buffer'}</DialogTitle>
              </DialogHeader>
              <Form {...bufferForm}>
                <form onSubmit={bufferForm.handleSubmit(onSubmitBuffer)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={bufferForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Drum Buffer - Line 1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bufferForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="time">Time Buffer</SelectItem>
                              <SelectItem value="stock">Stock Buffer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={bufferForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="drum">Drum Buffer</SelectItem>
                              <SelectItem value="feeding">Feeding Buffer</SelectItem>
                              <SelectItem value="shipping">Shipping Buffer</SelectItem>
                              <SelectItem value="stock">Stock Buffer</SelectItem>
                              <SelectItem value="space">Space Buffer</SelectItem>
                              <SelectItem value="capacity">Capacity Buffer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bufferForm.control}
                      name="uom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit of Measure</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., hours, units, kg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={bufferForm.control}
                      name="targetSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bufferForm.control}
                      name="currentSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={bufferForm.control}
                      name="greenZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Green Zone %</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bufferForm.control}
                      name="yellowZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yellow Zone %</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bufferForm.control}
                      name="redZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Red Zone %</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={bufferForm.control}
                      name="resourceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a resource" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {resources.map((resource: any) => (
                                <SelectItem key={resource.id} value={resource.id.toString()}>
                                  {resource.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bufferForm.control}
                      name="itemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {items.map((item: any) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={bufferForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Warehouse A, Production Line 1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsBufferDialogOpen(false);
                      setEditingBuffer(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={bufferMutation.isPending}>
                      {bufferMutation.isPending ? "Saving..." : editingBuffer ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Drums</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{drums.length}</div>
                <p className="text-xs text-muted-foreground">
                  Resources identified as constraints
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Buffers</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{buffers.filter((b: Buffer) => b.isActive).length}</div>
                <p className="text-xs text-muted-foreground">
                  Protecting production flow
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Red Zone Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {buffers.filter((b: Buffer) => b.zone === 'red').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Buffers requiring immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {drums.length > 0 
                    ? (drums.reduce((sum: number, d: DrumResource) => sum + (d.utilization || 0), 0) / drums.length).toFixed(1)
                    : '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average drum resource utilization
                </p>
              </CardContent>
            </Card>
          </div>

          {/* TOC Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>TOC Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Theory of Constraints implementation helps identify and manage production bottlenecks,
                    ensuring smooth flow and maximizing throughput.
                  </AlertDescription>
                </Alert>

                {drums.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Current Constraints</h3>
                    {drums.map((drum: DrumResource) => (
                      <div key={drum.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{drum.resourceName}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getDrumTypeColor(drum.drumType)} text-white`}>
                            {drum.drumType}
                          </Badge>
                          {drum.utilization && (
                            <div className="flex items-center gap-2">
                              <Progress value={drum.utilization} className="w-20 sm:w-24" />
                              <span className="text-sm text-gray-600">{drum.utilization.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {buffers.filter((b: Buffer) => b.zone === 'red' || b.zone === 'yellow').length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Buffer Alerts</h3>
                    {buffers
                      .filter((b: Buffer) => b.zone === 'red' || b.zone === 'yellow')
                      .map((buffer: Buffer) => (
                        <div key={buffer.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{buffer.name}</span>
                          <Badge className={getZoneColor(buffer.zone!)}>
                            {buffer.zone!.toUpperCase()} - {buffer.penetration?.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}