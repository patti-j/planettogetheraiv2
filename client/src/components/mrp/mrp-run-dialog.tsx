import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { insertMrpRunSchema } from "@shared/schema";

const mrpRunFormSchema = insertMrpRunSchema.extend({
  plantId: z.number().min(1, "Plant is required"),
  planningHorizon: z.number().min(1, "Planning horizon must be at least 1 day").max(999, "Maximum 999 days"),
  parameters: z.object({
    includeForecast: z.boolean().default(true),
    includeSafetyStock: z.boolean().default(true),
    firmedPlannedOrders: z.boolean().default(false),
    considerCapacity: z.boolean().default(false),
    leadTimeMethod: z.enum(["fixed", "variable", "dynamic"]).default("fixed"),
    lotSizeMethod: z.enum(["lot_for_lot", "eoq", "fixed", "period_order_quantity"]).default("lot_for_lot"),
  }).default({}),
});

type MrpRunFormData = z.infer<typeof mrpRunFormSchema>;

interface MrpRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MrpRunFormData) => void;
  isSubmitting: boolean;
}

export function MrpRunDialog({ open, onOpenChange, onSubmit, isSubmitting }: MrpRunDialogProps) {
  const { data: plants = [] } = useQuery({
    queryKey: ["/api/plants"],
  });

  const form = useForm<MrpRunFormData>({
    resolver: zodResolver(mrpRunFormSchema),
    defaultValues: {
      runNumber: `MRP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      description: "",
      runType: "net_change",
      planningHorizon: 365,
      cutoffDate: new Date().toISOString().split('T')[0] + 'T23:59:59.999Z',
      parameters: {
        includeForecast: true,
        includeSafetyStock: true,
        firmedPlannedOrders: false,
        considerCapacity: false,
        leadTimeMethod: "fixed",
        lotSizeMethod: "lot_for_lot",
      },
    },
  });

  const handleSubmit = (data: MrpRunFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New MRP Run</DialogTitle>
          <DialogDescription>
            Configure and start a new Material Requirements Planning calculation
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="runNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MRP-2025-001" />
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
                    <FormLabel>Plant</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plants.map((plant: any) => (
                          <SelectItem key={plant.id} value={plant.id.toString()}>
                            {plant.name}
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
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Optional description for this MRP run" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="runType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="net_change">Net Change</SelectItem>
                        <SelectItem value="regenerative">Regenerative</SelectItem>
                        <SelectItem value="single_level">Single Level</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Net Change: Process only changed items. Regenerative: Full recalculation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planningHorizon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planning Horizon (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days to plan ahead
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MRP Parameters</CardTitle>
                <CardDescription>
                  Configure how the MRP calculation should be performed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parameters.leadTimeMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Time Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="variable">Variable</SelectItem>
                            <SelectItem value="dynamic">Dynamic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parameters.lotSizeMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot Size Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lot_for_lot">Lot for Lot</SelectItem>
                            <SelectItem value="eoq">Economic Order Quantity</SelectItem>
                            <SelectItem value="fixed">Fixed Lot Size</SelectItem>
                            <SelectItem value="period_order_quantity">Period Order Quantity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parameters.includeForecast"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Include Forecast</FormLabel>
                          <FormDescription className="text-sm">
                            Use demand forecasts in calculations
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parameters.includeSafetyStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Include Safety Stock</FormLabel>
                          <FormDescription className="text-sm">
                            Consider safety stock requirements
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parameters.firmedPlannedOrders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Respect Firmed Orders</FormLabel>
                          <FormDescription className="text-sm">
                            Don't modify firmed planned orders
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parameters.considerCapacity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Consider Capacity</FormLabel>
                          <FormDescription className="text-sm">
                            Include capacity constraints
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create MRP Run"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}