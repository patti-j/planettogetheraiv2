import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  Target,
  Award,
  RefreshCw,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFederationModule } from '@/lib/federation-bootstrap';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface QualityInspection {
  id: number;
  operationId: number;
  itemName: string;
  inspectionType: string;
  inspector: string;
  inspectionDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: any[];
  defects?: number;
  passRate?: number;
}

interface QualityMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface DefectType {
  type: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface QualityStandard {
  id: number;
  name: string;
  itemType: string;
  minValue: number;
  maxValue: number;
  unit: string;
  compliance: number;
}

export default function QualityWidget() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [standards, setStandards] = useState<QualityStandard[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Quality KPIs
  const [kpis, setKpis] = useState({
    overallQualityRate: 0,
    firstPassYield: 0,
    defectRate: 0,
    inspectionsPending: 0,
    criticalDefects: 0,
    averageInspectionTime: 0
  });

  useEffect(() => {
    loadQualityData();
    
    // Set up real-time updates
    const interval = setInterval(loadQualityData, 15000); // Update every 15 seconds
    
    // Subscribe to quality events
    subscribeToQualityEvents();
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadQualityData = async () => {
    try {
      setLoading(true);
      const qualityModule = await getFederationModule('quality-management');
      
      // Get inspections
      const inspectionsResult = await qualityModule.getInspections({ 
        dateRange: getDateRange(timeRange) 
      });
      
      if (inspectionsResult.success) {
        // Use mock data for demo
        const mockInspections: QualityInspection[] = [
          {
            id: 1,
            operationId: 101,
            itemName: 'Component A-123',
            inspectionType: 'Dimensional Check',
            inspector: 'Jane Doe',
            inspectionDate: new Date(),
            status: 'completed',
            passRate: 98.5,
            defects: 2
          },
          {
            id: 2,
            operationId: 102,
            itemName: 'Assembly B-456',
            inspectionType: 'Visual Inspection',
            inspector: 'John Smith',
            inspectionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'completed',
            passRate: 95.0,
            defects: 5
          },
          {
            id: 3,
            operationId: 103,
            itemName: 'Product C-789',
            inspectionType: 'Functional Test',
            inspector: 'Sarah Johnson',
            inspectionDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
            status: 'in_progress',
            passRate: undefined,
            defects: undefined
          },
          {
            id: 4,
            operationId: 104,
            itemName: 'Part D-012',
            inspectionType: 'Material Test',
            inspector: 'Mike Wilson',
            inspectionDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
            status: 'failed',
            passRate: 85.0,
            defects: 15
          },
          {
            id: 5,
            operationId: 105,
            itemName: 'Module E-345',
            inspectionType: 'Performance Test',
            inspector: 'Emily Brown',
            inspectionDate: new Date(Date.now() + 60 * 60 * 1000),
            status: 'pending',
            passRate: undefined,
            defects: undefined
          }
        ];
        setInspections(mockInspections);
      }
      
      // Get quality metrics
      const metricsResult = await qualityModule.getQualityMetrics();
      if (metricsResult.success) {
        const mockMetrics: QualityMetric[] = [
          { name: 'Quality Rate', value: 96.5, target: 95, trend: 'up', unit: '%' },
          { name: 'First Pass Yield', value: 92.3, target: 90, trend: 'stable', unit: '%' },
          { name: 'Defect Rate', value: 3.5, target: 5, trend: 'down', unit: '%' },
          { name: 'Scrap Rate', value: 1.2, target: 2, trend: 'down', unit: '%' },
          { name: 'Rework Rate', value: 2.8, target: 3, trend: 'stable', unit: '%' },
          { name: 'Customer Returns', value: 0.5, target: 1, trend: 'down', unit: '%' }
        ];
        setMetrics(mockMetrics);
      }
      
      // Get defect analysis
      const defectResult = await qualityModule.getDefectAnalysis();
      if (defectResult.success) {
        const mockDefects: DefectType[] = [
          { type: 'Dimensional', count: 23, percentage: 35, severity: 'medium' },
          { type: 'Surface Finish', count: 18, percentage: 27, severity: 'low' },
          { type: 'Assembly', count: 15, percentage: 23, severity: 'high' },
          { type: 'Material', count: 7, percentage: 11, severity: 'critical' },
          { type: 'Other', count: 3, percentage: 4, severity: 'low' }
        ];
        setDefectTypes(mockDefects);
      }
      
      // Get quality standards
      const standardsResult = await qualityModule.getQualityStandards();
      if (standardsResult.success) {
        const mockStandards: QualityStandard[] = [
          { id: 1, name: 'Tolerance ±0.01mm', itemType: 'Precision Parts', minValue: -0.01, maxValue: 0.01, unit: 'mm', compliance: 98 },
          { id: 2, name: 'Surface Roughness', itemType: 'Machined Parts', minValue: 0, maxValue: 0.8, unit: 'μm', compliance: 95 },
          { id: 3, name: 'Tensile Strength', itemType: 'Materials', minValue: 500, maxValue: 600, unit: 'MPa', compliance: 97 },
          { id: 4, name: 'Color Match', itemType: 'Painted Parts', minValue: 90, maxValue: 100, unit: '%', compliance: 93 }
        ];
        setStandards(mockStandards);
      }
      
      // Update KPIs
      updateKPIs();
      
    } catch (error) {
      console.error('Error loading quality data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quality data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToQualityEvents = async () => {
    try {
      const qualityModule = await getFederationModule('quality-management');
      
      // Subscribe to quality alerts
      qualityModule.onQualityAlert((alert: any) => {
        toast({
          title: 'Quality Alert',
          description: alert.message,
          variant: alert.severity === 'critical' ? 'destructive' : 'default'
        });
        loadQualityData();
      });
      
      // Subscribe to inspection completions
      qualityModule.onInspectionComplete((inspection: any) => {
        toast({
          title: 'Inspection Complete',
          description: `Inspection for ${inspection.itemName} completed with ${inspection.passRate}% pass rate`,
        });
        loadQualityData();
      });
    } catch (error) {
      console.error('Error subscribing to quality events:', error);
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const updateKPIs = () => {
    const completed = inspections.filter(i => i.status === 'completed');
    const totalPassRate = completed.reduce((sum, i) => sum + (i.passRate || 0), 0) / completed.length;
    const totalDefects = completed.reduce((sum, i) => sum + (i.defects || 0), 0);
    const criticalDefects = defectTypes.filter(d => d.severity === 'critical').reduce((sum, d) => sum + d.count, 0);
    
    setKpis({
      overallQualityRate: totalPassRate || 0,
      firstPassYield: metrics.find(m => m.name === 'First Pass Yield')?.value || 0,
      defectRate: metrics.find(m => m.name === 'Defect Rate')?.value || 0,
      inspectionsPending: inspections.filter(i => i.status === 'pending').length,
      criticalDefects,
      averageInspectionTime: 45 // minutes (mock)
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'pending': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'low': 'text-blue-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'critical': 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  // Chart data
  const qualityTrendData = [
    { date: 'Mon', qualityRate: 94, target: 95 },
    { date: 'Tue', qualityRate: 95, target: 95 },
    { date: 'Wed', qualityRate: 96, target: 95 },
    { date: 'Thu', qualityRate: 97, target: 95 },
    { date: 'Fri', qualityRate: 96.5, target: 95 },
    { date: 'Sat', qualityRate: 96, target: 95 },
    { date: 'Sun', qualityRate: 96.5, target: 95 }
  ];

  const defectDistribution = defectTypes.map(d => ({
    name: d.type,
    value: d.count,
    fill: d.severity === 'critical' ? '#ef4444' : 
          d.severity === 'high' ? '#f97316' :
          d.severity === 'medium' ? '#f59e0b' : '#3b82f6'
  }));

  const standardsCompliance = standards.map(s => ({
    subject: s.name,
    compliance: s.compliance,
    fullMark: 100
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading quality data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.overallQualityRate.toFixed(1)}%</div>
            <Progress value={kpis.overallQualityRate} className="mt-1 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">First Pass Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.firstPassYield.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Target: 90%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.defectRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Target: &lt;5%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.inspectionsPending}</div>
            <p className="text-xs text-muted-foreground">To be completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Defects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.criticalDefects}</div>
            <p className="text-xs text-muted-foreground">This {timeRange}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Inspection Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.averageInspectionTime}m</div>
            <p className="text-xs text-muted-foreground">Per inspection</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inspections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="defects">Defects</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
        </TabsList>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Inspections</CardTitle>
                <div className="flex gap-2">
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <Button size="sm" variant="outline" onClick={loadQualityData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {inspections.map((inspection) => (
                    <Card 
                      key={inspection.id}
                      className={`cursor-pointer transition-all ${
                        selectedInspection?.id === inspection.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedInspection(inspection)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <h4 className="font-medium">{inspection.itemName}</h4>
                            </div>
                            <Badge className={getStatusColor(inspection.status)}>
                              {inspection.status.toUpperCase()}
                            </Badge>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Type: {inspection.inspectionType}</p>
                              <p>Inspector: {inspection.inspector}</p>
                              <p>Date: {format(inspection.inspectionDate, 'MMM dd, HH:mm')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {inspection.passRate !== undefined && (
                              <>
                                <div className="text-2xl font-bold">
                                  {inspection.passRate}%
                                </div>
                                <p className="text-sm text-muted-foreground">Pass Rate</p>
                                {inspection.defects !== undefined && (
                                  <div className="mt-2">
                                    <Badge variant={inspection.defects > 10 ? 'destructive' : 'secondary'}>
                                      {inspection.defects} defects
                                    </Badge>
                                  </div>
                                )}
                              </>
                            )}
                            {inspection.status === 'pending' && (
                              <Button size="sm" className="mt-2">
                                Start Inspection
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold">
                          {metric.value}{metric.unit}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Target: {metric.target}{metric.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quality Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={qualityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="qualityRate" stroke="#10b981" name="Quality Rate" />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Defects Tab */}
        <TabsContent value="defects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Defect Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {defectTypes.map((defect) => (
                    <div key={defect.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${getSeverityColor(defect.severity)}`} />
                        <span className="font-medium">{defect.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {defect.severity}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{defect.count}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({defect.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Defect Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={defectDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {defectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {kpis.criticalDefects > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {kpis.criticalDefects} critical defects detected this {timeRange}. 
                Immediate action required to prevent quality issues.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Standards Tab */}
        <TabsContent value="standards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Standards Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {standards.map((standard) => (
                    <div key={standard.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{standard.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {standard.itemType} ({standard.minValue} - {standard.maxValue} {standard.unit})
                          </p>
                        </div>
                        <Badge 
                          variant={standard.compliance >= 95 ? 'default' : 
                                  standard.compliance >= 90 ? 'secondary' : 'destructive'}
                        >
                          {standard.compliance}%
                        </Badge>
                      </div>
                      <Progress value={standard.compliance} className="h-2" />
                    </div>
                  ))}
                </div>
                
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={standardsCompliance}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Compliance" dataKey="compliance" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}