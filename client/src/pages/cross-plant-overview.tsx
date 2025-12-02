import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  Globe, Factory, AlertTriangle, CheckCircle2, TrendingUp, 
  LayoutDashboard, Zap, Cpu, ArrowRight, Clock, Target,
  Building2, Sparkles
} from 'lucide-react';
import { 
  LANE_DEFINITIONS, 
  LANE_ORDER, 
  getLaneDefinition,
  type LaneKey 
} from '@/lib/implementation-lanes';
import { LaneProgressionTracker } from '@/components/onboarding/lane-progression-tracker';

interface PlantLaneStatus {
  plantId: number;
  plantName: string | null;
  onboardingId: number | null;
  currentLane: LaneKey | null;
  targetLane: LaneKey | null;
  laneProgress: number | null;
  laneStartDate: string | null;
  laneTargetDate: string | null;
  status: string | null;
  overallProgress: number | null;
}

interface LaneStats {
  plantsByLane: Array<{ currentLane: LaneKey; count: number }>;
  requirementsByLane: Array<{ targetLane: LaneKey; count: number }>;
}

export default function CrossPlantOverview() {
  const [selectedLaneFilter, setSelectedLaneFilter] = useState<string>('all');

  const { data: plantsWithLanes = [], isLoading: loadingPlants } = useQuery<PlantLaneStatus[]>({
    queryKey: ['/api/plants/lane-status']
  });

  const { data: laneStats } = useQuery<LaneStats>({
    queryKey: ['/api/implementation-lanes/stats']
  });

  const { data: implementationLanes = [] } = useQuery<Array<{
    id: number;
    laneNumber: number;
    name: string;
    shortName: string;
    description: string;
    valueProposition: string;
    features: string[];
    dataRequirements: string[];
    color: string;
    icon: string;
  }>>({
    queryKey: ['/api/implementation-lanes']
  });

  const filteredPlants = selectedLaneFilter === 'all' 
    ? plantsWithLanes 
    : plantsWithLanes.filter(p => p.currentLane === selectedLaneFilter);

  const getLaneIcon = (lane: LaneKey | null) => {
    if (!lane) return Globe;
    const def = getLaneDefinition(lane);
    return def.icon;
  };

  const plantsWithLaneData = filteredPlants.filter(p => p.currentLane !== null).map(p => ({
    plantId: p.plantId,
    plantName: p.plantName || `Plant ${p.plantId}`,
    currentLane: p.currentLane as LaneKey,
    targetLane: p.targetLane as LaneKey || 'lane_1' as LaneKey,
    laneProgress: p.laneProgress || 0,
    laneStartDate: p.laneStartDate || undefined,
    laneTargetDate: p.laneTargetDate || undefined
  }));

  const laneDistribution = LANE_ORDER.map(laneKey => {
    const count = plantsWithLanes.filter(p => p.currentLane === laneKey).length;
    const lane = getLaneDefinition(laneKey);
    return { laneKey, count, lane };
  });

  const totalPlants = plantsWithLanes.length;
  const plantsInProgress = plantsWithLanes.filter(p => p.status === 'in-progress').length;
  const plantsCompleted = plantsWithLanes.filter(p => p.status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Globe className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Cross-Plant Overview
            </h1>
            <p className="text-muted-foreground">
              Lane 0 Control Tower - Companywide visibility across all plants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedLaneFilter} onValueChange={setSelectedLaneFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-lane-filter">
              <SelectValue placeholder="Filter by lane" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lanes</SelectItem>
              {LANE_ORDER.map(laneKey => {
                const lane = getLaneDefinition(laneKey);
                return (
                  <SelectItem key={laneKey} value={laneKey}>
                    {lane.shortName}: {lane.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {laneDistribution.map(({ laneKey, count, lane }) => {
          const IconComponent = lane.icon;
          const percentage = totalPlants > 0 ? Math.round((count / totalPlants) * 100) : 0;
          
          return (
            <Card 
              key={laneKey} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedLaneFilter === laneKey ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ 
                ['--tw-ring-color' as any]: lane.color
              }}
              onClick={() => setSelectedLaneFilter(selectedLaneFilter === laneKey ? 'all' : laneKey)}
              data-testid={`card-lane-${laneKey}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${lane.color}20` }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color: lane.color }} />
                  </div>
                  <Badge 
                    variant="outline"
                    style={{ borderColor: lane.color, color: lane.color }}
                  >
                    {count} plants
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm">{lane.shortName}</h3>
                <p className="text-xs text-muted-foreground mb-2">{lane.name}</p>
                <Progress 
                  value={percentage} 
                  className="h-1.5" 
                />
                <p className="text-xs text-muted-foreground mt-1">{percentage}% of plants</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Plant Implementation Status
            </CardTitle>
            <CardDescription>
              {filteredPlants.length} plants {selectedLaneFilter !== 'all' ? `in ${getLaneDefinition(selectedLaneFilter as LaneKey).name}` : 'total'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPlants ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading plants...
              </div>
            ) : filteredPlants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No plants have started implementation yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Plants will appear here once they begin onboarding.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlants.map(plant => {
                  const currentLaneDef = plant.currentLane ? getLaneDefinition(plant.currentLane) : null;
                  const IconComponent = plant.currentLane ? getLaneIcon(plant.currentLane) : Globe;
                  
                  return (
                    <div 
                      key={plant.plantId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      data-testid={`plant-row-${plant.plantId}`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: currentLaneDef ? `${currentLaneDef.color}20` : '#e5e7eb' 
                          }}
                        >
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: currentLaneDef?.color || '#6b7280' }} 
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{plant.plantName || `Plant ${plant.plantId}`}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {currentLaneDef && (
                              <span>{currentLaneDef.shortName}</span>
                            )}
                            {plant.status && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {plant.status}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={plant.laneProgress || 0} 
                              className="w-24 h-2" 
                            />
                            <span className="text-sm font-medium w-10 text-right">
                              {plant.laneProgress || 0}%
                            </span>
                          </div>
                          {plant.laneTargetDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {new Date(plant.laneTargetDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" data-testid={`btn-view-plant-${plant.plantId}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5" />
                Implementation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Plants</span>
                <span className="font-semibold">{totalPlants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {plantsInProgress}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {plantsCompleted}
                </Badge>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-semibold">
                    {totalPlants > 0 ? Math.round((plantsCompleted / totalPlants) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={totalPlants > 0 ? (plantsCompleted / totalPlants) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plantsWithLanes.filter(p => p.laneProgress && p.laneProgress > 80 && p.currentLane !== 'lane_3').slice(0, 3).map(plant => {
                  const nextLane = plant.currentLane ? 
                    LANE_ORDER[LANE_ORDER.indexOf(plant.currentLane) + 1] : null;
                  const nextLaneDef = nextLane ? getLaneDefinition(nextLane) : null;
                  
                  return (
                    <div 
                      key={plant.plantId}
                      className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    >
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {plant.plantName} is ready to advance
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        {plant.laneProgress}% complete in {plant.currentLane ? getLaneDefinition(plant.currentLane).shortName : 'current lane'}
                        {nextLaneDef && ` → Consider moving to ${nextLaneDef.shortName}`}
                      </p>
                    </div>
                  );
                })}
                
                {plantsWithLanes.filter(p => p.laneProgress && p.laneProgress > 80).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No AI recommendations at this time.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {plantsWithLaneData.length > 0 && (
        <LaneProgressionTracker 
          plants={plantsWithLaneData}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lane Strategy Overview
          </CardTitle>
          <CardDescription>
            The 4-lane implementation strategy enables rapid companywide adoption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LANE_ORDER.map(laneKey => {
              const lane = getLaneDefinition(laneKey);
              const IconComponent = lane.icon;
              const plantCount = plantsWithLanes.filter(p => p.currentLane === laneKey).length;
              
              return (
                <div 
                  key={laneKey}
                  className={`p-4 rounded-lg border-2 ${lane.bgColor} ${lane.borderColor}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${lane.color}30` }}
                    >
                      <IconComponent className="h-5 w-5" style={{ color: lane.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{lane.shortName}</h4>
                      <p className="text-xs text-muted-foreground">{lane.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {lane.valueProposition.split('.')[0]}.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plants:</span>
                    <Badge variant="outline">{plantCount}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~{lane.typicalDurationWeeks} weeks
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
