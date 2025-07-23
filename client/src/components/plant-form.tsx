import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertPlantSchema, type Plant, type InsertPlant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant?: Plant | null;
}

export function PlantForm({ open, onOpenChange, plant }: PlantFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!plant;

  const form = useForm<InsertPlant>({
    resolver: zodResolver(insertPlantSchema),
    defaultValues: {
      name: plant?.name || "",
      address: plant?.address || "",
      timezone: plant?.timezone || "UTC",
      isActive: plant?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertPlant) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/plants/${plant.id}`, data);
      } else {
        return apiRequest("POST", "/api/plants", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: isEditing ? "Plant updated" : "Plant created",
        description: isEditing ? "Plant has been updated successfully." : "New plant has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save plant",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlant) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Plant" : "Add New Plant"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update plant information." : "Create a new manufacturing plant location."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Manufacturing Plant" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this plant location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Manufacturing Drive, Industrial City, State"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical address of the plant location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="America/New_York" {...field} />
                  </FormControl>
                  <FormDescription>
                    Timezone for scheduling operations (e.g., America/New_York, Europe/London).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Plant is actively accepting jobs and operations.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}