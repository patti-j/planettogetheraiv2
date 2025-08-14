import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Activity,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OptimizationMetrics {
  efficiency: number;
  throughput: number;
  utilization: number;
  makespan: number;
}

interface OptimizationHistory {
  id: string;
  timestamp: string;
  algorithm: string;
  duration: number;
  improvement: number;
  status: 'completed' | 'failed' | 'running';
}

interface ScheduleOptimizationConfig {
  showQuickActions?: boolean;
  showHistory?: boolean;
  showMetrics?: boolean;
  maxHistoryItems?: number;
  defaultView?: 'overview' | 'detailed';
  showAlgorithmSelector?: boolean;
  showProfileSelector?: boolean;
}

interface ScheduleOptimizationWidgetProps {
  config?: ScheduleOptimizationConfig;
  data?: any;
  onAction?: (action: string, data?: any) => void;
}

export function ScheduleOptimizationWidget({ 
  config = {}, 
  data = {}, 
  onAction 
}: ScheduleOptimizationWidgetProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('genetic');
  const [selectedProfile, setSelectedProfile] = useState('balanced');

  const defaultConfig: ScheduleOptimizationConfig = {
    showQuickActions: true,
    showHistory: true,
    showMetrics: true,
    maxHistoryItems: 5,
    defaultView: 'overview',
    showAlgorithmSelector: true,
    showProfileSelector: true,
    ...config
  };

  // Mock data - in real implementation this would come from props/API
  const metrics: OptimizationMetrics = {
    efficiency: data?.efficiency || 87.5,
    throughput: data?.throughput || 245.8,
    utilization: data?.utilization || 82.3,
    makespan: data?.makespan || 145.2
  };

  const history: OptimizationHistory[] = data?.history || [
    {
      id: '1',
      timestamp: '2025-08-14 14:30:00',
      algorithm: 'Genetic Algorithm',
      duration: 45,
      improvement: 12.5,
      status: 'completed'
    },
    {
      id: '2', 
      timestamp: '2025-08-14 13:15:00',
      algorithm: 'Simulated Annealing',
      duration: 38,
      improvement: 8.3,
      status: 'completed'
    }
  ];

  const algorithms = [
    { id: 'genetic', name: 'Genetic Algorithm', description: 'Best for complex schedules' },
    { id: 'simulated', name: 'Simulated Annealing', description: 'Fast convergence' },
    { id: 'tabu', name: 'Tabu Search', description: 'Avoids local optima' },
    { id: 'aco', name: 'Ant Colony', description: 'Good for routing problems' }
  ];

  const profiles = [
    { id: 'speed', name: 'Speed Focused', description: 'Minimize makespan' },
    { id: 'balanced', name: 'Balanced', description: 'Balance all objectives' },
    { id: 'efficiency', name: 'Efficiency Focused', description: 'Maximize resource utilization' },
    { id: 'quality', name: 'Quality Focused', description: 'Minimize setup changes' }
  ];

  const handleOptimize = async () => {
    setIsOptimizing(true);
    onAction?.('optimize', { algorithm: selectedAlgorithm, profile: selectedProfile });
    
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Optimization Complete",
        description: `Schedule optimized using ${algorithms.find(a => a.id === selectedAlgorithm)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAction = (action: string, actionData?: any) => {
    onAction?.(action, actionData);
    
    switch (action) {
      case 'reset':
        toast({
          title: "Schedule Reset",
          description: "Reverted to original schedule",
        });
        break;
      case 'settings':
        toast({
          title: "Settings",
          description: "Opening optimization settings...",
        });
        break;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Schedule Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultConfig.showQuickActions && (
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Optimize
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleAction('reset')}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleAction('settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        )}

        {defaultConfig.showAlgorithmSelector && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Algorithm</label>
            <select 
              value={selectedAlgorithm} 
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              {algorithms.map(alg => (
                <option key={alg.id} value={alg.id}>
                  {alg.name} - {alg.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {defaultConfig.showProfileSelector && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Optimization Profile</label>
            <select 
              value={selectedProfile} 
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} - {profile.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {defaultConfig.showMetrics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.efficiency}%</div>
              <div className="text-sm text-gray-600">Efficiency</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.throughput}</div>
              <div className="text-sm text-gray-600">Throughput</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{metrics.utilization}%</div>
              <div className="text-sm text-gray-600">Utilization</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics.makespan}h</div>
              <div className="text-sm text-gray-600">Makespan</div>
            </div>
          </div>
        )}

        {defaultConfig.showHistory && history.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Optimizations</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {history.slice(0, defaultConfig.maxHistoryItems).map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.algorithm}</div>
                    <div className="text-xs text-gray-500">
                      {item.timestamp} • {item.duration}s
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'completed' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>
                      {item.status}
                    </Badge>
                    {item.status === 'completed' && (
                      <div className="text-green-600 font-medium">
                        +{item.improvement}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ScheduleOptimizationWidget;