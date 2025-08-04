import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface ResourceAssignmentWidgetProps {
  className?: string;
}

interface ResourceAssignment {
  id: number;
  resourceName: string;
  resourceType: 'equipment' | 'operator' | 'station';
  currentOperation?: string;
  operationId?: number;
  utilizationPercent: number;
  status: 'available' | 'busy' | 'maintenance' | 'offline';
  assignedOperations: number;
  nextOperation?: string;
  nextOperationTime?: string;
  skill_level?: string;
  department: string;
}

export default function ResourceAssignmentWidget({ 
  className = '' 
}: ResourceAssignmentWidgetProps) {
  const resources: ResourceAssignment[] = [
    {
      id: 1,
      resourceName: "Production Line 1",
      resourceType: "equipment",
      currentOperation: "Widget A Assembly",
      operationId: 101,
      utilizationPercent: 85,
      status: "busy",
      assignedOperations: 3,
      nextOperation: "Widget B Assembly",
      nextOperationTime: "14:30",
      department: "Manufacturing"
    },
    {
      id: 2,
      resourceName: "John Smith",
      resourceType: "operator",
      currentOperation: "Quality Inspection",
      operationId: 102,
      utilizationPercent: 70,
      status: "busy",
      assignedOperations: 2,
      skill_level: "Senior",
      department: "Quality Control"
    },
    {
      id: 3,
      resourceName: "Mixer Station A",
      resourceType: "station",
      utilizationPercent: 0,
      status: "maintenance",
      assignedOperations: 0,
      nextOperation: "Maintenance Complete",
      nextOperationTime: "16:00",
      department: "Manufacturing"
    },
    {
      id: 4,
      resourceName: "Sarah Johnson",
      resourceType: "operator",
      utilizationPercent: 45,
      status: "available",
      assignedOperations: 1,
      nextOperation: "Material Prep",
      nextOperationTime: "15:15",
      skill_level: "Junior",
      department: "Preparation"
    },
    {
      id: 5,
      resourceName: "Packaging Line 2",
      resourceType: "equipment",
      currentOperation: "Widget C Packaging",
      operationId: 103,
      utilizationPercent: 92,
      status: "busy",
      assignedOperations: 4,
      department: "Packaging"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'busy': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'offline': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'operator': return <User className="w-4 h-4" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded" />;
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {resources.filter(r => r.status === 'available').length}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {resources.filter(r => r.status === 'busy').length}
            </div>
            <div className="text-xs text-muted-foreground">Busy</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {resources.filter(r => r.status === 'maintenance').length}
            </div>
            <div className="text-xs text-muted-foreground">Maintenance</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(resources.reduce((sum, r) => sum + r.utilizationPercent, 0) / resources.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Utilization</div>
          </div>
        </Card>
      </div>

      {/* Resource List */}
      <div className="space-y-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getResourceIcon(resource.resourceType)}
                  <div>
                    <div className="font-medium">{resource.resourceName}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {resource.resourceType} • {resource.department}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(resource.status)}
                  <Badge variant="outline" className="capitalize">
                    {resource.status}
                  </Badge>
                  {resource.skill_level && (
                    <Badge variant="secondary" className="text-xs">
                      {resource.skill_level}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Current Activity */}
              {resource.currentOperation && (
                <div className="bg-muted p-2 rounded">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Current:</span>{' '}
                    <span className="font-medium">{resource.currentOperation}</span>
                  </div>
                </div>
              )}

              {/* Utilization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className={`font-medium ${getUtilizationColor(resource.utilizationPercent)}`}>
                    {resource.utilizationPercent}%
                  </span>
                </div>
                <Progress value={resource.utilizationPercent} className="h-2" />
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Assigned Operations:</span>
                  <div className="font-medium">{resource.assignedOperations}</div>
                </div>
                {resource.nextOperation && (
                  <div>
                    <span className="text-muted-foreground">Next:</span>
                    <div className="font-medium">
                      {resource.nextOperation}
                      {resource.nextOperationTime && (
                        <span className="text-muted-foreground ml-1">
                          @ {resource.nextOperationTime}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Resource Type Distribution */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Resource Distribution</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">
              {resources.filter(r => r.resourceType === 'equipment').length}
            </div>
            <div className="text-xs text-muted-foreground">Equipment</div>
          </div>
          <div>
            <div className="text-lg font-bold">  
              {resources.filter(r => r.resourceType === 'operator').length}
            </div>
            <div className="text-xs text-muted-foreground">Operators</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {resources.filter(r => r.resourceType === 'station').length}
            </div>
            <div className="text-xs text-muted-foreground">Stations</div>
          </div>
        </div>
      </Card>
    </div>
  );
}