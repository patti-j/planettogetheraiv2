import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PlayCircle, 
  Clock, 
  Users, 
  ChevronRight, 
  Loader2,
  BookOpen,
  Target,
  Settings,
  TrendingUp,
  Factory,
  BarChart3
} from "lucide-react";
import { useTour } from "@/contexts/TourContext";

interface TourSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Tour {
  id: number;
  roleId: number;
  roleDisplayName: string;
  tourData: {
    steps: any[];
    totalSteps: number;
    estimatedDuration: string;
    voiceScriptCount: number;
  };
  isGenerated: boolean;
  allowSystemInteraction: boolean;
  generatedAt: string;
}

// Icon mapping for different roles
const getRoleIcon = (roleName: string) => {
  const name = roleName.toLowerCase();
  if (name.includes('director')) return TrendingUp;
  if (name.includes('scheduler')) return BarChart3;
  if (name.includes('manager')) return Users;
  if (name.includes('systems')) return Settings;
  if (name.includes('plant')) return Factory;
  if (name.includes('operator')) return Settings;
  return BookOpen;
};

export function TourSelectionDialog({ open, onOpenChange }: TourSelectionDialogProps) {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const { startTour } = useTour();

  // Fetch available tours
  const { data: tours = [], isLoading, error } = useQuery({
    queryKey: ['/api/tours'],
    enabled: open
  }) as { data: Tour[], isLoading: boolean, error: any };

  const handleStartTour = (tour: Tour) => {
    // Start the tour with the specific role
    startTour(tour.roleId, true, 'demo');
    onOpenChange(false);
  };

  const handleStartDefaultTour = () => {
    // Start default production scheduler tour if no specific tours available
    startTour(3, true, 'demo');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Choose a Guided Tour
          </DialogTitle>
          <p className="text-gray-600">
            Select a tour to explore different roles and features in the system. Tours are interactive and will guide you through key functionality.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading available tours...</span>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">No custom tours available yet</span>
                </div>
                <p className="text-yellow-700 mt-1 text-sm">
                  Tours can be created by trainers in the Training section. For now, we'll show you a default tour.
                </p>
              </div>
              
              {/* Default tour option */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <BarChart3 className="w-5 h-5" />
                        Production Scheduler Demo Tour
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        A comprehensive tour showing production scheduling, resource management, and optimization features.
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Default
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-blue-700">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>5-10 minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Production Scheduler</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleStartDefaultTour}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start Tour
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : tours.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tours Available</h3>
                <p className="text-gray-600 mb-4">
                  No guided tours have been created yet. Tours can be generated by trainers in the Training section.
                </p>
                <Button 
                  onClick={handleStartDefaultTour}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Default Demo Tour
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {tours.map((tour) => {
                  const RoleIcon = getRoleIcon(tour.roleDisplayName);
                  
                  return (
                    <Card 
                      key={tour.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer border-gray-200"
                      onClick={() => setSelectedTour(tour)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="flex items-center gap-2 text-gray-900">
                              <RoleIcon className="w-5 h-5 text-blue-600" />
                              {tour.roleDisplayName} Tour
                            </CardTitle>
                            <CardDescription>
                              Explore features and workflows designed for the {tour.roleDisplayName} role.
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1">
                            {tour.isGenerated && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                AI Generated
                              </Badge>
                            )}
                            {tour.allowSystemInteraction && (
                              <Badge variant="outline" className="text-xs">
                                Interactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{tour.tourData.estimatedDuration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>{tour.tourData.totalSteps} steps</span>
                            </div>
                          </div>
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTour(tour);
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Start Tour
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Default tour option always available */}
              <div className="border-t pt-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                          <BarChart3 className="w-5 h-5" />
                          Production Scheduler Demo Tour
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                          A comprehensive default tour showing core production scheduling features.
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Default
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-blue-700">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>5-10 minutes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Production Scheduler</span>
                        </div>
                      </div>
                      <Button 
                        onClick={handleStartDefaultTour}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Start Tour
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}