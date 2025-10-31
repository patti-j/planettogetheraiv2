import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Package, Users, History, AlertCircle, CheckCircle, Clock, Ban, Plus, Edit2, Trash2, Info, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Item {
  id: number;
  itemNumber: string;
  itemName: string;
  description?: string;
}

interface Resource {
  id: number;
  name: string;
  type?: string;
  description?: string;
}

interface MaterialReservation {
  id?: number;
  itemId: number;
  itemNumber?: string;
  itemName?: string;
  requiredQuantity: number;
  reservedQuantity?: number;
  unitOfMeasure?: string;
  isAvailable?: boolean;
}

interface ResourceReservation {
  id?: number;
  resourceId: number;
  resourceName?: string;
  resourceType?: string;
  startTime: string;
  endTime: string;
  requiredCapacity?: number;
  isAvailable?: boolean;
  hasConflict?: boolean;
}

interface Reservation {
  id: number;
  reservationNumber: string;
  type: 'material' | 'resource' | 'both';
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  jobId?: number;
  orderNumber?: string;
  startDate: string;
  endDate: string;
  description?: string;
  notes?: string;
  materials?: MaterialReservation[];
  resources?: ResourceReservation[];
  createdAt: string;
  updatedAt: string;
}

export default function AtpCtpReservations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state for creating/editing reservations
  const [formData, setFormData] = useState({
    type: 'both' as 'material' | 'resource' | 'both',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    orderNumber: '',
    startDate: '',
    endDate: '',
    description: '',
    notes: '',
    materials: [] as MaterialReservation[],
    resources: [] as ResourceReservation[]
  });

  // Fetch reservations
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['/api/atp-ctp/reservations', filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      const response = await fetch(`/api/atp-ctp/reservations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reservations');
      return response.json();
    }
  });

  // Fetch items for material selection
  const { data: items = [] } = useQuery({
    queryKey: ['/api/items']
  });

  // Fetch resources for resource selection
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources']
  });

  // Create reservation mutation
  const createReservation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/atp-ctp/reservations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/atp-ctp/reservations'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Reservation created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create reservation",
        variant: "destructive"
      });
    }
  });

  // Update reservation mutation
  const updateReservation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/atp-ctp/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/atp-ctp/reservations'] });
      setSelectedReservation(null);
      toast({
        title: "Success",
        description: "Reservation updated successfully"
      });
    }
  });

  // Cancel reservation mutation
  const cancelReservation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      apiRequest(`/api/atp-ctp/reservations/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/atp-ctp/reservations'] });
      setSelectedReservation(null);
      toast({
        title: "Success",
        description: "Reservation cancelled successfully"
      });
    }
  });

  // Confirm reservation mutation
  const confirmReservation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/atp-ctp/reservations/${id}/confirm`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/atp-ctp/reservations'] });
      toast({
        title: "Success",
        description: "Reservation confirmed successfully"
      });
    }
  });

  // Check availability mutations
  const checkMaterialAvailability = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/atp-ctp/check-material-availability', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  });

  const checkResourceAvailability = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/atp-ctp/check-resource-availability', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  });

  const resetForm = () => {
    setFormData({
      type: 'both',
      priority: 'medium',
      orderNumber: '',
      startDate: '',
      endDate: '',
      description: '',
      notes: '',
      materials: [],
      resources: []
    });
  };

  const addMaterialRow = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, {
        itemId: 0,
        requiredQuantity: 0,
        unitOfMeasure: 'EA'
      }]
    }));
  };

  const addResourceRow = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, {
        resourceId: 0,
        startTime: prev.startDate,
        endTime: prev.endDate,
        requiredCapacity: 1
      }]
    }));
  };

  const removeMaterialRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const removeResourceRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const updateMaterialRow = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const updateResourceRow = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please select start and end dates",
        variant: "destructive"
      });
      return;
    }

    createReservation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Ban },
      expired: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn(config.color, "flex items-center gap-1")}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    const color = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge className={color}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const filteredReservations = reservations.filter((r: Reservation) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!r.reservationNumber?.toLowerCase().includes(search) &&
          !r.orderNumber?.toLowerCase().includes(search) &&
          !r.description?.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">ATP/CTP Reservations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage Available-to-Promise and Capable-to-Promise reservations for materials and resources
        </p>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search reservations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="material">Material Only</SelectItem>
                <SelectItem value="resource">Resource Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create ATP/CTP Reservation</DialogTitle>
                  <DialogDescription>
                    Reserve materials and resources for a specific time period
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Reservation Type</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material">Material Only</SelectItem>
                          <SelectItem value="resource">Resource Only</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                      placeholder="Optional order reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the reservation"
                    />
                  </div>

                  {/* Material Reservations */}
                  {(formData.type === 'material' || formData.type === 'both') && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Material Reservations</Label>
                        <Button type="button" size="sm" variant="outline" onClick={addMaterialRow}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Material
                        </Button>
                      </div>
                      
                      {formData.materials.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-3">
                          {formData.materials.map((material, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Label className="text-xs">Item</Label>
                                <Select
                                  value={material.itemId?.toString()}
                                  onValueChange={(value) => updateMaterialRow(index, 'itemId', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select item" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map((item: Item) => (
                                      <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.itemNumber} - {item.itemName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="w-32">
                                <Label className="text-xs">Quantity</Label>
                                <Input
                                  type="number"
                                  value={material.requiredQuantity}
                                  onChange={(e) => updateMaterialRow(index, 'requiredQuantity', parseFloat(e.target.value))}
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              
                              <div className="w-24">
                                <Label className="text-xs">UOM</Label>
                                <Input
                                  value={material.unitOfMeasure || ''}
                                  onChange={(e) => updateMaterialRow(index, 'unitOfMeasure', e.target.value)}
                                  placeholder="EA"
                                />
                              </div>
                              
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMaterialRow(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resource Reservations */}
                  {(formData.type === 'resource' || formData.type === 'both') && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Resource Reservations</Label>
                        <Button type="button" size="sm" variant="outline" onClick={addResourceRow}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Resource
                        </Button>
                      </div>
                      
                      {formData.resources.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-3">
                          {formData.resources.map((resource, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Label className="text-xs">Resource</Label>
                                <Select
                                  value={resource.resourceId?.toString()}
                                  onValueChange={(value) => updateResourceRow(index, 'resourceId', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select resource" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {resources.map((res: Resource) => (
                                      <SelectItem key={res.id} value={res.id.toString()}>
                                        {res.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="w-40">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                  type="datetime-local"
                                  value={resource.startTime}
                                  onChange={(e) => updateResourceRow(index, 'startTime', e.target.value)}
                                />
                              </div>
                              
                              <div className="w-40">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                  type="datetime-local"
                                  value={resource.endTime}
                                  onChange={(e) => updateResourceRow(index, 'endTime', e.target.value)}
                                />
                              </div>
                              
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeResourceRow(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes or comments"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createReservation.isPending}>
                      {createReservation.isPending ? 'Creating...' : 'Create Reservation'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reservations</CardTitle>
          <CardDescription>
            Manage and track ATP/CTP reservations across materials and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations found. Create your first reservation to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation: Reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.reservationNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reservation.type === 'both' ? 'Material & Resource' : 
                         reservation.type.charAt(0).toUpperCase() + reservation.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell>{reservation.priority && getPriorityBadge(reservation.priority)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(reservation.startDate), 'MMM d, yyyy')}</div>
                        <div className="text-gray-500">to {format(new Date(reservation.endDate), 'MMM d, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.orderNumber || '-'}</TableCell>
                    <TableCell>{format(new Date(reservation.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReservation(reservation)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        
                        {reservation.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirmReservation.mutate(reservation.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {['pending', 'confirmed'].includes(reservation.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this reservation?')) {
                                cancelReservation.mutate({ id: reservation.id });
                              }
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reservation Details Dialog */}
      {selectedReservation && (
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reservation Details</DialogTitle>
              <DialogDescription>
                {selectedReservation.reservationNumber}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Priority</Label>
                    <div className="mt-1">
                      {selectedReservation.priority && getPriorityBadge(selectedReservation.priority)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Type</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {selectedReservation.type === 'both' ? 'Material & Resource' : 
                         selectedReservation.type.charAt(0).toUpperCase() + selectedReservation.type.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Order Number</Label>
                    <div className="mt-1">{selectedReservation.orderNumber || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Start Date</Label>
                    <div className="mt-1">
                      {format(new Date(selectedReservation.startDate), 'PPP')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">End Date</Label>
                    <div className="mt-1">
                      {format(new Date(selectedReservation.endDate), 'PPP')}
                    </div>
                  </div>
                </div>
                
                {selectedReservation.description && (
                  <div>
                    <Label className="text-sm text-gray-500">Description</Label>
                    <div className="mt-1">{selectedReservation.description}</div>
                  </div>
                )}
                
                {selectedReservation.notes && (
                  <div>
                    <Label className="text-sm text-gray-500">Notes</Label>
                    <div className="mt-1">{selectedReservation.notes}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="materials">
                {selectedReservation.materials && selectedReservation.materials.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Number</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Required Qty</TableHead>
                        <TableHead>Reserved Qty</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReservation.materials.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell>{material.itemNumber}</TableCell>
                          <TableCell>{material.itemName}</TableCell>
                          <TableCell>{material.requiredQuantity}</TableCell>
                          <TableCell>{material.reservedQuantity || '-'}</TableCell>
                          <TableCell>{material.unitOfMeasure}</TableCell>
                          <TableCell>
                            {material.isAvailable ? (
                              <Badge className="bg-green-100 text-green-800">Available</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Not Available</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No material reservations for this reservation.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resources">
                {selectedReservation.resources && selectedReservation.resources.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReservation.resources.map((resource, index) => (
                        <TableRow key={index}>
                          <TableCell>{resource.resourceName}</TableCell>
                          <TableCell>{resource.resourceType}</TableCell>
                          <TableCell>
                            {format(new Date(resource.startTime), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(resource.endTime), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>{resource.requiredCapacity}</TableCell>
                          <TableCell>
                            {resource.hasConflict ? (
                              <Badge className="bg-red-100 text-red-800">Conflict</Badge>
                            ) : resource.isAvailable ? (
                              <Badge className="bg-green-100 text-green-800">Available</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No resource reservations for this reservation.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                <div className="text-center py-4 text-gray-500">
                  History tracking will be available soon.
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}