import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, ArrowRight, Info, ChevronRight, Clock } from 'lucide-react';
import { 
  LANE_DEFINITIONS, 
  LANE_ORDER, 
  getLaneDefinition, 
  type LaneKey,
  type LaneDefinition 
} from '@/lib/implementation-lanes';

interface PlantLaneStatus {
  plantId: number;
  plantName: string;
  currentLane: LaneKey;
  targetLane: LaneKey;
  laneProgress: number;
  laneStartDate?: string;
  laneTargetDate?: string;
}

interface LaneProgressionTrackerProps {
  plants: PlantLaneStatus[];
  onPlantClick?: (plantId: number) => void;
  showCompact?: boolean;
}

function LaneCard({ 
  lane, 
  isCompleted, 
  isCurrent, 
  isTarget,
  progress 
}: { 
  lane: LaneDefinition; 
  isCompleted: boolean; 
  isCurrent: boolean;
  isTarget: boolean;
  progress?: number;
}) {
  const IconComponent = lane.icon;
  
  return (
    <div 
      className={`
        relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
        ${isCompleted ? `${lane.bgColor} ${lane.borderColor} opacity-100` : ''}
        ${isCurrent ? `${lane.bgColor} ${lane.borderColor} ring-2 ring-offset-2` : ''}
        ${!isCompleted && !isCurrent ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 opacity-60' : ''}
        ${isTarget && !isCurrent ? 'border-dashed' : ''}
      `}
      style={{ 
        '--ring-color': isCurrent ? lane.color : 'transparent',
        ringColor: isCurrent ? lane.color : undefined 
      } as React.CSSProperties}
    >
      {isCompleted && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
      )}
      
      <div 
        className="p-3 rounded-full mb-2"
        style={{ backgroundColor: `${lane.color}20` }}
      >
        <IconComponent 
          className="h-6 w-6" 
          style={{ color: lane.color }}
        />
      </div>
      
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        {lane.shortName}
      </span>
      <span className="text-sm font-medium text-center mt-1">
        {lane.name}
      </span>
      
      {isCurrent && progress !== undefined && (
        <div className="w-full mt-3">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {progress}% complete
          </span>
        </div>
      )}
      
      {isTarget && !isCurrent && (
        <Badge variant="outline" className="mt-2 text-xs">
          Target
        </Badge>
      )}
    </div>
  );
}

function LaneDetailsDialog({ lane }: { lane: LaneDefinition }) {
  const IconComponent = lane.icon;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-full"
              style={{ backgroundColor: `${lane.color}20` }}
            >
              <IconComponent className="h-6 w-6" style={{ color: lane.color }} />
            </div>
            <div>
              <DialogTitle>{lane.shortName}: {lane.name}</DialogTitle>
              <DialogDescription>{lane.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Value Proposition
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lane.valueProposition}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Data Requirements</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {lane.dataRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Features Included</h4>
              <div className="flex flex-wrap gap-2">
                {lane.features.map((feature, i) => (
                  <Badge key={i} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
            
            {lane.prerequisites.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Prerequisites</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {lane.prerequisites.map((prereq, i) => (
                    <li key={i}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              Typical duration: {lane.typicalDurationWeeks} week{lane.typicalDurationWeeks !== 1 ? 's' : ''}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function LaneProgressionTracker({ 
  plants, 
  onPlantClick,
  showCompact = false 
}: LaneProgressionTrackerProps) {
  const [selectedPlant, setSelectedPlant] = useState<PlantLaneStatus | null>(
    plants.length > 0 ? plants[0] : null
  );

  if (plants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Implementation Lane Progression
          </CardTitle>
          <CardDescription>
            No plants have been added to the implementation yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentLaneIndex = selectedPlant 
    ? LANE_ORDER.indexOf(selectedPlant.currentLane)
    : 0;
  const targetLaneIndex = selectedPlant 
    ? LANE_ORDER.indexOf(selectedPlant.targetLane)
    : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2" data-testid="lane-tracker-title">
              Implementation Lane Progression
            </CardTitle>
            <CardDescription>
              Track plant progress through the 4-lane implementation strategy
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {plants.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {plants.map((plant) => (
              <Button
                key={plant.plantId}
                variant={selectedPlant?.plantId === plant.plantId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlant(plant)}
                data-testid={`button-plant-${plant.plantId}`}
              >
                {plant.plantName}
              </Button>
            ))}
          </div>
        )}

        {selectedPlant && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {LANE_ORDER.map((laneKey, index) => {
                const lane = getLaneDefinition(laneKey);
                const isCompleted = index < currentLaneIndex;
                const isCurrent = index === currentLaneIndex;
                const isTarget = index === targetLaneIndex;
                
                return (
                  <div key={laneKey} className="relative">
                    <LaneCard
                      lane={lane}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isTarget={isTarget}
                      progress={isCurrent ? selectedPlant.laneProgress : undefined}
                    />
                    <div className="absolute top-2 right-2">
                      <LaneDetailsDialog lane={lane} />
                    </div>
                    {index < LANE_ORDER.length - 1 && (
                      <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ChevronRight className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  {selectedPlant.plantName} - Current Status
                </h4>
                {onPlantClick && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onPlantClick(selectedPlant.plantId)}
                    data-testid="button-view-plant-details"
                  >
                    View Details <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Current Lane</span>
                  <div className="font-medium flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLaneDefinition(selectedPlant.currentLane).color }}
                    />
                    {getLaneDefinition(selectedPlant.currentLane).shortName}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Target Lane</span>
                  <div className="font-medium flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLaneDefinition(selectedPlant.targetLane).color }}
                    />
                    {getLaneDefinition(selectedPlant.targetLane).shortName}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lane Progress</span>
                  <div className="font-medium mt-1">{selectedPlant.laneProgress}%</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Target Date</span>
                  <div className="font-medium mt-1">
                    {selectedPlant.laneTargetDate 
                      ? new Date(selectedPlant.laneTargetDate).toLocaleDateString()
                      : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function LaneProgressionMini({ 
  currentLane, 
  targetLane, 
  laneProgress 
}: { 
  currentLane: LaneKey; 
  targetLane: LaneKey;
  laneProgress: number;
}) {
  const currentLaneDef = getLaneDefinition(currentLane);
  const targetLaneDef = getLaneDefinition(targetLane);
  const IconComponent = currentLaneDef.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <div 
              className="p-1.5 rounded"
              style={{ backgroundColor: `${currentLaneDef.color}20` }}
            >
              <IconComponent className="h-4 w-4" style={{ color: currentLaneDef.color }} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">{currentLaneDef.shortName}</span>
              <div className="flex items-center gap-1">
                <Progress value={laneProgress} className="h-1.5 w-16" />
                <span className="text-xs text-gray-500">{laneProgress}%</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div><strong>Current:</strong> {currentLaneDef.name}</div>
            <div><strong>Target:</strong> {targetLaneDef.name}</div>
            <div><strong>Progress:</strong> {laneProgress}%</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function LaneBadge({ lane }: { lane: LaneKey }) {
  const laneDef = getLaneDefinition(lane);
  const IconComponent = laneDef.icon;
  
  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-1.5"
      style={{ 
        borderColor: laneDef.color,
        color: laneDef.color,
        backgroundColor: `${laneDef.color}10`
      }}
    >
      <IconComponent className="h-3 w-3" />
      {laneDef.shortName}
    </Badge>
  );
}
