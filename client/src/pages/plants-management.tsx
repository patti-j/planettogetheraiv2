import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Building, MapPin, Clock, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Plant } from "@shared/schema";
import { PlantForm } from "@/components/plant-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function PlantsManagementPage() {
  const [plantFormOpen, setPlantFormOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/plants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: "Plant deleted",
        description: "Plant has been deleted successfully.",
      });
      setPlantToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plant",
        variant: "destructive",
      });
    },
  });

  const handleEditPlant = (plant: Plant) => {
    setEditingPlant(plant);
    setPlantFormOpen(true);
  };

  const handleDeletePlant = (plant: Plant) => {
    setPlantToDelete(plant);
  };

  const confirmDelete = () => {
    if (plantToDelete) {
      deleteMutation.mutate(plantToDelete.id);
    }
  };

  const closeForm = () => {
    setPlantFormOpen(false);
    setEditingPlant(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center">
            <Building className="w-6 h-6 mr-2" />
            Plants Management
          </h1>
          <p className="text-gray-600">Loading plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 md:ml-0 ml-12">
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold flex items-center">
            <Building className="w-6 h-6 mr-2" />
            Plants Management
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage manufacturing plant locations and their configurations
          </p>
        </div>
        <Button
          onClick={() => setPlantFormOpen(true)}
          className="flex items-center space-x-2 lg:flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plant</span>
        </Button>
      </div>

      {plants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No plants found
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by creating your first manufacturing plant location.
            </p>
            <Button onClick={() => setPlantFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Plant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="grid gap-4 md:hidden">
            {(plants as Plant[]).map((plant: Plant) => (
              <Card key={plant.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plant.name}</CardTitle>
                      <div className="flex items-center mt-1">
                        <Badge variant={plant.isActive ? "default" : "secondary"}>
                          <Activity className="w-3 h-3 mr-1" />
                          {plant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlant(plant)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlant(plant)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {plant.address && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{plant.address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{plant.timezone}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(plants as Plant[]).map((plant: Plant) => (
                  <TableRow key={plant.id}>
                    <TableCell className="font-medium">{plant.name}</TableCell>
                    <TableCell className="max-w-xs">
                      {plant.address ? (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm">{plant.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No address</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{plant.timezone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plant.isActive ? "default" : "secondary"}>
                        <Activity className="w-3 h-3 mr-1" />
                        {plant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlant(plant)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlant(plant)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <PlantForm
        open={plantFormOpen}
        onOpenChange={closeForm}
        plant={editingPlant}
      />

      <AlertDialog
        open={!!plantToDelete}
        onOpenChange={() => setPlantToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{plantToDelete?.name}"? This action
              cannot be undone and may affect resources and jobs assigned to this plant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}