import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Package, Plus, Pencil, Save, X } from "lucide-react";
import { MasterProductionSchedule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface MasterProductionSchedulePanelProps {
  schedule: MasterProductionSchedule[];
  isLoading: boolean;
}

const mpsFormSchema = z.object({
  itemId: z.number().min(1, "Item is required"),
  plantId: z.number().min(1, "Plant is required"),
  periodType: z.enum(["daily", "weekly", "monthly"]),
  planningHorizon: z.number().min(1, "Planning horizon must be at least 1"),
  bucketStartDate: z.string().min(1, "Start date is required"),
  bucketEndDate: z.string().min(1, "End date is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  firmedQuantity: z.number().min(0, "Firmed quantity must be non-negative"),
  source: z.enum(["forecast", "sales_order", "manual"]),
  notes: z.string().optional(),
});

type MpsFormData = z.infer<typeof mpsFormSchema>;

export function MasterProductionSchedulePanel({ schedule, isLoading }: MasterProductionSchedulePanelProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MasterProductionSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<MpsFormData>({
    resolver: zodResolver(mpsFormSchema),
    defaultValues: {
      periodType: "weekly",
      planningHorizon: 52,
      quantity: 0,
      firmedQuantity: 0,
      source: "manual",
      bucketStartDate: new Date().toISOString().split('T')[0],
      bucketEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  // Create MPS entry
  const createMutation = useMutation({
    mutationFn: (data: MpsFormData) => apiRequest("/api/mrp/master-production-schedule", "POST", {
      ...data,
      bucketStartDate: new Date(data.bucketStartDate).toISOString(),
      bucketEndDate: new Date(data.bucketEndDate).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/master-production-schedule"] });
      toast({ title: "MPS entry created successfully" });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create MPS entry", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update MPS entry
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MpsFormData> }) => 
      apiRequest(`/api/mrp/master-production-schedule/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/master-production-schedule"] });
      toast({ title: "MPS entry updated successfully" });
      setEditingEntry(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update MPS entry", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete MPS entry
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/mrp/master-production-schedule/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/master-production-schedule"] });
      toast({ title: "MPS entry deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete MPS entry", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredSchedule = schedule.filter((entry) => {
    if (!searchTerm) return true;
    return entry.itemId.toString().includes(searchTerm.toLowerCase());
  });

  const handleCreate = (data: MpsFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (entry: MasterProductionSchedule) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = (entry: MasterProductionSchedule, field: string, value: any) => {
    updateMutation.mutate({
      id: entry.id,
      data: { [field]: value },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this MPS entry?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading master production schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Master Production Schedule
              </CardTitle>
              <CardDescription>
                Define what you plan to produce and when
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSchedule.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No master production schedule entries found</p>
              <p className="text-sm">Create your first entry to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Plant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Planned Quantity</TableHead>
                    <TableHead className="text-right">Firmed Quantity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedule.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {entry.itemId}
                        </div>
                      </TableCell>
                      <TableCell>{entry.plantId}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{entry.periodType}</div>
                          <div className="text-muted-foreground">
                            {formatDate(new Date(entry.bucketStartDate))} - {formatDate(new Date(entry.bucketEndDate))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingEntry?.id === entry.id ? (
                          <Input
                            type="number"
                            defaultValue={entry.quantity}
                            className="w-20"
                            onBlur={(e) => {
                              if (e.target.value !== entry.quantity) {
                                handleSaveEdit(entry, "quantity", parseFloat(e.target.value));
                              }
                            }}
                          />
                        ) : (
                          <span onClick={() => handleEdit(entry)} className="cursor-pointer hover:bg-muted px-2 py-1 rounded">
                            {parseFloat(entry.quantity).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingEntry?.id === entry.id ? (
                          <Input
                            type="number"
                            defaultValue={entry.firmedQuantity || 0}
                            className="w-20"
                            onBlur={(e) => {
                              if (e.target.value !== entry.firmedQuantity) {
                                handleSaveEdit(entry, "firmedQuantity", parseFloat(e.target.value));
                              }
                            }}
                          />
                        ) : (
                          <span onClick={() => handleEdit(entry)} className="cursor-pointer hover:bg-muted px-2 py-1 rounded">
                            {parseFloat(entry.firmedQuantity || "0").toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{entry.source.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.isActive 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        }`}>
                          {entry.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {editingEntry?.id === entry.id ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditingEntry(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => setEditingEntry(null)}>
                                <Save className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDelete(entry.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create MPS Entry Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Master Production Schedule Entry</DialogTitle>
            <DialogDescription>
              Add a new entry to your master production schedule
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item ID</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plant ID</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="periodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bucketStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bucketEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Quantity</FormLabel>
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
                  control={form.control}
                  name="firmedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firmed Quantity</FormLabel>
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

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="forecast">Forecast</SelectItem>
                        <SelectItem value="sales_order">Sales Order</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}