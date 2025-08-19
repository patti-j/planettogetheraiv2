import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Factory, Clock, Beer } from 'lucide-react';

export default function DemoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // Fetch production orders/jobs
  const { data: productionOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/pt-jobs'],
    enabled: true
  });
  
  // Fetch PT operations
  const { data: operations, isLoading: loadingOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });
  
  // Fetch resources
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });

  const isLoading = loadingOrders || loadingOperations || loadingResources;

  // Group operations by resource
  const operationsByResource = operations?.reduce((acc: any, op: any) => {
    const resourceId = op.resourceId || op.assignedResourceId || 'unassigned';
    if (!acc[resourceId]) {
      acc[resourceId] = [];
    }
    acc[resourceId].push(op);
    return acc;
  }, {}) || {};

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-blue-500';
      case 'not started': return 'bg-gray-400';
      default: return 'bg-yellow-500';
    }
  };

  // Get operation type color
  const getOperationColor = (operationName: string) => {
    if (operationName?.includes('Milling')) return 'border-orange-400 bg-orange-50';
    if (operationName?.includes('Mashing')) return 'border-amber-400 bg-amber-50';
    if (operationName?.includes('Boiling')) return 'border-red-400 bg-red-50';
    if (operationName?.includes('Fermentation')) return 'border-purple-400 bg-purple-50';
    if (operationName?.includes('Conditioning')) return 'border-blue-400 bg-blue-50';
    if (operationName?.includes('Filtration')) return 'border-cyan-400 bg-cyan-50';
    if (operationName?.includes('Carbonation')) return 'border-indigo-400 bg-indigo-50';
    if (operationName?.includes('Packaging')) return 'border-green-400 bg-green-50';
    if (operationName?.includes('Quality')) return 'border-yellow-400 bg-yellow-50';
    return 'border-gray-300 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-lg font-medium">Loading Brewery Production Data...</p>
            <p className="text-sm text-gray-500">Fetching operations and resources</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Beer className="h-6 w-6 text-amber-600" />
              <CardTitle>Brewery Production Schedule Demo</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                <Factory className="h-3 w-3 mr-1" />
                {resources?.length || 0} Resources
              </Badge>
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                {operations?.length || 0} Operations
              </Badge>
              <Badge variant="secondary">
                {productionOrders?.length || 0} Jobs
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resources List */}
        <div className="lg:col-span-1 space-y-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Brewery Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {resources?.slice(0, 20).map((resource: any) => (
                <div
                  key={resource.id}
                  onClick={() => setSelectedResource(resource)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedResource?.id === resource.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{resource.name}</div>
                  <div className="text-xs text-gray-500">{resource.location || resource.type}</div>
                  {operationsByResource[resource.id] && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {operationsByResource[resource.id].length} operations
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Operations Timeline */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedResource 
                  ? `Operations for ${selectedResource.name}`
                  : 'Recent Brewery Operations'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {(selectedResource 
                ? operationsByResource[selectedResource.id] || []
                : operations?.slice(0, 30) || []
              ).map((op: any) => (
                <div 
                  key={op.id} 
                  className={`p-4 border-2 rounded-lg ${getOperationColor(op.operationName || op.name)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {op.jobName || `Job ${op.jobId}`}
                      </div>
                      <div className="text-lg font-medium text-gray-800">
                        {op.operationName || op.name}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(op.activityStatus || op.status)} text-white`}>
                      {op.activityStatus || op.status || 'Scheduled'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Duration: {op.duration || Math.round((op.cycleTime || 1) * 60)} min
                    </div>
                    {op.resourceName && (
                      <div className="flex items-center">
                        <Factory className="h-3 w-3 mr-1" />
                        {op.resourceName}
                      </div>
                    )}
                  </div>
                  
                  {op.startTime && (
                    <div className="mt-2 text-xs text-gray-500">
                      Start: {new Date(op.startTime).toLocaleString()}
                    </div>
                  )}
                  
                  {op.outputName && (
                    <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                      Output: {op.outputName}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Footer */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              This demo displays brewery production data with {operations?.length || 0} operations across {resources?.length || 0} resources.
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}