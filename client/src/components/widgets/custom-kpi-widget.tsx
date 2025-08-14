import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Calendar,
  Settings,
  Plus,
  Edit,
  AlertTriangle,
  CheckCircle,
  Minus
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CustomKPI {
  id: string;
  name: string;
  description: string;
  target: number;
  currentValue: number;
  unit: string;
  type: 'percentage' | 'number' | 'currency' | 'time';
  frequency: 'daily' | 'weekly' | 'monthly';
  color: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  history: { date: string; value: number }[];
}

interface CustomKPIWidgetProps {
  configuration?: {
    view?: 'compact' | 'standard' | 'detailed';
    showTrends?: boolean;
    showTargets?: boolean;
    showHistory?: boolean;
    maxKPIs?: number;
    allowEdit?: boolean;
    isCompact?: boolean;
    dynamicResize?: boolean;
    containerWidth?: number;
    containerHeight?: number;
    maxItems?: number;
  };
  kpis?: CustomKPI[];
  onKPIUpdate?: (kpi: CustomKPI) => void;
}

const defaultKPIs: CustomKPI[] = [
  {
    id: 'oee',
    name: 'Overall Equipment Effectiveness',
    description: 'Manufacturing efficiency metric combining availability, performance, and quality',
    target: 85,
    currentValue: 78.5,
    unit: '%',
    type: 'percentage',
    frequency: 'daily',
    color: 'blue',
    trend: 'up',
    trendValue: 2.3,
    category: 'Production',
    priority: 'high',
    history: [
      { date: '2025-08-07', value: 76.2 },
      { date: '2025-08-08', value: 77.1 },
      { date: '2025-08-09', value: 78.5 },
      { date: '2025-08-10', value: 78.5 }
    ]
  },
  {
    id: 'yield',
    name: 'First Pass Yield',
    description: 'Percentage of products that pass quality inspection on first attempt',
    target: 95,
    currentValue: 92.3,
    unit: '%',
    type: 'percentage',
    frequency: 'daily',
    color: 'green',
    trend: 'down',
    trendValue: -1.2,
    category: 'Quality',
    priority: 'high',
    history: [
      { date: '2025-08-07', value: 93.5 },
      { date: '2025-08-08', value: 92.8 },
      { date: '2025-08-09', value: 92.3 },
      { date: '2025-08-10', value: 92.3 }
    ]
  },
  {
    id: 'cost-per-unit',
    name: 'Cost Per Unit',
    description: 'Average manufacturing cost per unit produced',
    target: 45,
    currentValue: 48.2,
    unit: '$',
    type: 'currency',
    frequency: 'weekly',
    color: 'orange',
    trend: 'up',
    trendValue: 3.2,
    category: 'Cost',
    priority: 'medium',
    history: [
      { date: '2025-08-07', value: 45.0 },
      { date: '2025-08-08', value: 46.5 },
      { date: '2025-08-09', value: 48.2 },
      { date: '2025-08-10', value: 48.2 }
    ]
  }
];

const CustomKPIWidget: React.FC<CustomKPIWidgetProps> = ({ 
  configuration = {
    view: 'standard',
    showTrends: true,
    showTargets: true,
    showHistory: true,
    maxKPIs: 6,
    allowEdit: true
  },
  kpis = defaultKPIs,
  onKPIUpdate
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingKPI, setEditingKPI] = useState<CustomKPI | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const formatValue = (value: number, type: string, unit: string) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `${unit}${value.toFixed(2)}`;
      case 'time':
        return `${value}${unit}`;
      default:
        return `${value}${unit}`;
    }
  };

  const getStatusColor = (current: number, target: number, type: string) => {
    if (!current || !target) return 'text-gray-600';
    const percentage = (current / target) * 100;
    const category = (type || '').toLowerCase();
    if (category === 'cost') {
      // For costs, lower is better
      if (percentage <= 100) return 'text-green-600';
      if (percentage <= 110) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      // For other metrics, higher is better
      if (percentage >= 95) return 'text-green-600';
      if (percentage >= 85) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProgressValue = (current: number, target: number, type: string) => {
    if (!current || !target) return 0;
    const category = (type || '').toLowerCase();
    if (category === 'cost') {
      // For costs, we want to show how close we are to being under target
      return Math.min(100, (target / current) * 100);
    }
    return Math.min(100, (current / target) * 100);
  };

  const renderCompactView = () => {
    // Dynamic grid columns based on container dimensions
    const gridCols = configuration.containerWidth && configuration.dynamicResize
      ? configuration.containerWidth >= 400 ? 'grid-cols-3' : 
        configuration.containerWidth >= 280 ? 'grid-cols-2' : 'grid-cols-1'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    
    const maxItems = configuration.maxItems || configuration.maxKPIs || 3;
    
    return (
      <div className={`grid ${gridCols} gap-2`}>
        {kpis.slice(0, maxItems).map((kpi) => (
          <Card key={kpi.id} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium truncate">{kpi.name}</h4>
            {configuration.showTrends && getTrendIcon(kpi.trend)}
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-lg font-bold ${getStatusColor(kpi.currentValue, kpi.target, kpi.category || 'production')}`}>
                {formatValue(kpi.currentValue, kpi.type, kpi.unit)}
              </span>
              {configuration.showTargets && (
                <span className="text-xs text-gray-500">
                  Target: {formatValue(kpi.target, kpi.type, kpi.unit)}
                </span>
              )}
            </div>
            {configuration.showTargets && (
              <Progress 
                value={getProgressValue(kpi.currentValue, kpi.target, kpi.category || 'production')} 
                className="h-1" 
              />
            )}
          </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderStandardView = () => {
    // Dynamic grid for standard view
    const gridCols = configuration.containerWidth && configuration.dynamicResize
      ? configuration.containerWidth >= 600 ? 'grid-cols-3' : 
        configuration.containerWidth >= 400 ? 'grid-cols-2' : 'grid-cols-1'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    
    const maxItems = configuration.maxItems || configuration.maxKPIs || 6;
    
    return (
      <div className={`grid ${gridCols} gap-3`}>
        {kpis.slice(0, maxItems).map((kpi) => (
        <Card key={kpi.id} className="p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              <Badge variant="outline" className={`text-xs ${kpi.priority === 'high' ? 'border-red-200 text-red-700' : 
                kpi.priority === 'medium' ? 'border-yellow-200 text-yellow-700' : 'border-gray-200 text-gray-700'}`}>
                {kpi.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-2xl font-bold ${getStatusColor(kpi.currentValue, kpi.target, kpi.category || 'production')}`}>
                  {formatValue(kpi.currentValue, kpi.type, kpi.unit)}
                </span>
                {configuration.showTrends && (
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(kpi.trend)}
                    <span className="text-sm text-gray-600">
                      {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}%
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Target</div>
                <div className="text-lg font-semibold">
                  {formatValue(kpi.target, kpi.type, kpi.unit)}
                </div>
              </div>
            </div>
            {configuration.showTargets && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{getProgressValue(kpi.currentValue, kpi.target, kpi.category || 'production').toFixed(0)}%</span>
                </div>
                <Progress 
                  value={getProgressValue(kpi.currentValue, kpi.target, kpi.category || 'production')} 
                  className="h-2" 
                />
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{kpi.category}</span>
              <span>{kpi.frequency}</span>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    );
  };

  const renderDetailedView = () => (
    <div className="space-y-6">
      {kpis.slice(0, configuration.maxKPIs).map((kpi) => (
        <Card key={kpi.id} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{kpi.name}</h3>
                  <p className="text-sm text-gray-600">{kpi.description}</p>
                </div>
                {configuration.allowEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingKPI(kpi)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Current</div>
                  <div className={`text-2xl font-bold ${getStatusColor(kpi.currentValue, kpi.target, kpi.category || 'production')}`}>
                    {formatValue(kpi.currentValue, kpi.type, kpi.unit)}
                  </div>
                  {configuration.showTrends && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {getTrendIcon(kpi.trend)}
                      <span className="text-sm text-gray-600">
                        {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Target</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.target, kpi.type, kpi.unit)}
                  </div>
                  <div className="mt-2">
                    <Badge variant={
                      getProgressValue(kpi.currentValue, kpi.target, kpi.category || "production") >= 95 ? 'default' :
                      getProgressValue(kpi.currentValue, kpi.target, kpi.category || "production") >= 85 ? 'secondary' : 'destructive'
                    }>
                      {getProgressValue(kpi.currentValue, kpi.target, kpi.category || "production").toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>

              <Progress 
                value={getProgressValue(kpi.currentValue, kpi.target, kpi.category || "production")} 
                className="h-3" 
              />
            </div>

            {configuration.showHistory && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Trend History</h4>
                <div className="h-40">
                  <Line
                    data={{
                      labels: kpi.history.map(h => h.date),
                      datasets: [
                        {
                          label: kpi.name,
                          data: kpi.history.map(h => h.value),
                          borderColor: kpi.color === 'blue' ? '#3b82f6' : 
                                     kpi.color === 'green' ? '#10b981' : 
                                     kpi.color === 'orange' ? '#f59e0b' : '#6b7280',
                          backgroundColor: kpi.color === 'blue' ? '#3b82f620' : 
                                          kpi.color === 'green' ? '#10b98120' : 
                                          kpi.color === 'orange' ? '#f59e0b20' : '#6b728020',
                          fill: true,
                          tension: 0.4,
                        },
                        {
                          label: 'Target',
                          data: kpi.history.map(() => kpi.target),
                          borderColor: '#ef4444',
                          borderDash: [5, 5],
                          fill: false,
                          pointRadius: 0,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          display: false
                        },
                        y: {
                          beginAtZero: false
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom KPIs</h3>
        {configuration.allowEdit && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add KPI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom KPI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>KPI Name</Label>
                  <Input placeholder="e.g., Overall Equipment Effectiveness" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input placeholder="Brief description of the KPI" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Value</Label>
                    <Input type="number" placeholder="85" />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="%">Percentage (%)</SelectItem>
                        <SelectItem value="$">Currency ($)</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="cost">Cost</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">Create KPI</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {configuration.view === 'compact' && renderCompactView()}
      {configuration.view === 'standard' && renderStandardView()}
      {configuration.view === 'detailed' && renderDetailedView()}
    </div>
  );
};

export default CustomKPIWidget;