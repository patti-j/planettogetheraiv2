import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Share2, 
  RotateCcw,
  PlayCircle,
  CheckCircle,
  XCircle,
  Info,
  Calculator,
  Zap,
  Target
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProductionOrder {
  id: number;
  orderNumber: string;
  name: string;
  dueDate: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  priority: number;
  status: string;
  customer?: string;
  quantity: number;
  completionPercentage: number;
}

interface TradeoffAnalysis {
  targetOrder: ProductionOrder;
  proposedStartDate: string;
  proposedEndDate: string;
  impactedOrders: {
    order: ProductionOrder;
    impactType: 'delayed' | 'rescheduled' | 'resource_conflict';
    originalDate: string;
    newDate: string;
    delayDays: number;
    riskLevel: 'low' | 'medium' | 'high';
    customerImpact: boolean;
  }[];
  resourceConflicts: {
    resourceId: number;
    resourceName: string;
    conflictPeriod: { start: string; end: string };
    affectedOrders: number[];
  }[];
  metrics: {
    totalOrdersAffected: number;
    avgDelayDays: number;
    highRiskOrders: number;
    customerOrdersAffected: number;
    totalCostImpact: number;
    scheduleEfficiencyImpact: number;
  };
}

interface ScheduleTradeoffAnalyzerWidgetProps {
  configuration?: {
    showResourceConflicts: boolean;
    showCostAnalysis: boolean;
    showCustomerImpact: boolean;
    maxAnalysisDepth: number;
  };
  isDesktop?: boolean;
}

export default function ScheduleTradeoffAnalyzerWidget({ 
  configuration = {
    showResourceConflicts: true,
    showCostAnalysis: true,
    showCustomerImpact: true,
    maxAnalysisDepth: 5
  },
  isDesktop = false
}: ScheduleTradeoffAnalyzerWidgetProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [proposedDate, setProposedDate] = useState<string>("");
  const [analysisNotes, setAnalysisNotes] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("setup");
  const [currentAnalysis, setCurrentAnalysis] = useState<TradeoffAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production orders
  const { data: productionOrders = [], isLoading: ordersLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
  });

  // Mutation for running trade-off analysis
  const analyzeTradeoffMutation = useMutation({
    mutationFn: async (data: { orderId: number; proposedStartDate: string; notes?: string }) => {
      return apiRequest("POST", "/api/schedule/analyze-tradeoff", data);
    },
    onSuccess: (analysis: TradeoffAnalysis) => {
      setCurrentAnalysis(analysis);
      setActiveTab("analysis");
      toast({
        title: "Analysis Complete",
        description: "Trade-off analysis has been completed successfully."
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze schedule trade-offs. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for committing changes to schedule
  const commitChangesMutation = useMutation({
    mutationFn: async (data: { analysisId: string; notes: string }) => {
      return apiRequest("POST", "/api/schedule/commit-tradeoff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      toast({
        title: "Changes Applied",
        description: "Schedule changes have been committed successfully."
      });
      handleReset();
    },
    onError: () => {
      toast({
        title: "Commit Failed",
        description: "Failed to commit schedule changes. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for sharing analysis
  const shareAnalysisMutation = useMutation({
    mutationFn: async (data: { analysisId: string; recipients: string[]; message: string }) => {
      return apiRequest("POST", "/api/schedule/share-analysis", data);
    },
    onSuccess: () => {
      toast({
        title: "Analysis Shared",
        description: "Trade-off analysis has been shared with the selected team members."
      });
    }
  });

  const filteredOrders = useMemo(() => {
    return productionOrders.filter(order => 
      order.status !== 'completed' && order.status !== 'cancelled'
    );
  }, [productionOrders]);

  const selectedOrder = useMemo(() => {
    return filteredOrders.find(order => order.id.toString() === selectedOrderId);
  }, [filteredOrders, selectedOrderId]);

  const handleAnalyze = () => {
    if (!selectedOrderId || !proposedDate) {
      toast({
        title: "Missing Information",
        description: "Please select an order and proposed date.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    analyzeTradeoffMutation.mutate({
      orderId: parseInt(selectedOrderId),
      proposedStartDate: proposedDate,
      notes: analysisNotes
    });
  };

  const handleCommit = () => {
    if (!currentAnalysis) return;
    
    commitChangesMutation.mutate({
      analysisId: currentAnalysis.targetOrder.id.toString(),
      notes: analysisNotes
    });
  };

  const handleShare = () => {
    if (!currentAnalysis) return;
    
    // In a real implementation, this would open a dialog to select recipients
    shareAnalysisMutation.mutate({
      analysisId: currentAnalysis.targetOrder.id.toString(),
      recipients: ["production_manager@company.com", "operations_team@company.com"],
      message: analysisNotes || "Please review this schedule trade-off analysis."
    });
  };

  const handleReset = () => {
    setSelectedOrderId("");
    setProposedDate("");
    setAnalysisNotes("");
    setCurrentAnalysis(null);
    setActiveTab("setup");
    setIsAnalyzing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'delayed': return TrendingDown;
      case 'rescheduled': return Calendar;
      case 'resource_conflict': return AlertTriangle;
      default: return Info;
    }
  };

  if (ordersLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Schedule Trade-off Analyzer
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!currentAnalysis}>Analysis</TabsTrigger>
            <TabsTrigger value="actions" disabled={!currentAnalysis}>Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="order-select">Production Order to Expedite</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a production order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.orderNumber} - {order.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Current Schedule</h4>
                  <div className="text-sm space-y-1">
                    <div>Current Start: {new Date(selectedOrder.scheduledStartDate).toLocaleDateString()}</div>
                    <div>Current End: {new Date(selectedOrder.scheduledEndDate).toLocaleDateString()}</div>
                    <div>Due Date: {new Date(selectedOrder.dueDate).toLocaleDateString()}</div>
                    <div>Priority: {selectedOrder.priority}</div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="proposed-date">Proposed New Start Date</Label>
                <Input
                  id="proposed-date"
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Analysis Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add context or reasoning for this expediting request..."
                  value={analysisNotes}
                  onChange={(e) => setAnalysisNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleAnalyze}
                disabled={!selectedOrderId || !proposedDate || analyzeTradeoffMutation.isPending}
                className="w-full"
              >
                {analyzeTradeoffMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing Trade-offs...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze Trade-offs
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 overflow-y-auto space-y-4">
            {currentAnalysis && (
              <div className="space-y-4">
                {/* Impact Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{currentAnalysis.metrics.totalOrdersAffected}</div>
                    <div className="text-xs text-gray-600">Orders Affected</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{currentAnalysis.metrics.avgDelayDays.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">Avg Delay (Days)</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{currentAnalysis.metrics.highRiskOrders}</div>
                    <div className="text-xs text-gray-600">High Risk</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{currentAnalysis.metrics.customerOrdersAffected}</div>
                    <div className="text-xs text-gray-600">Customer Orders</div>
                  </div>
                </div>

                {/* Impacted Orders */}
                <div>
                  <h4 className="font-medium mb-3">Impacted Orders</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentAnalysis.impactedOrders.map((impact, index) => {
                      const IconComponent = getImpactIcon(impact.impactType);
                      return (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              <span className="font-medium">{impact.order.orderNumber}</span>
                              <Badge variant="outline" className={`${getRiskColor(impact.riskLevel)} text-white`}>
                                {impact.riskLevel}
                              </Badge>
                            </div>
                            {impact.customerImpact && (
                              <Badge variant="destructive">Customer Impact</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Original: {new Date(impact.originalDate).toLocaleDateString()}</div>
                            <div>New: {new Date(impact.newDate).toLocaleDateString()}</div>
                            <div>Delay: {impact.delayDays} days</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resource Conflicts */}
                {configuration.showResourceConflicts && currentAnalysis.resourceConflicts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Resource Conflicts</h4>
                    <div className="space-y-2">
                      {currentAnalysis.resourceConflicts.map((conflict, index) => (
                        <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-medium">{conflict.resourceName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Conflict Period: {new Date(conflict.conflictPeriod.start).toLocaleDateString()} - {new Date(conflict.conflictPeriod.end).toLocaleDateString()}</div>
                            <div>Affected Orders: {conflict.affectedOrders.length}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="flex-1 overflow-y-auto space-y-4">
            {currentAnalysis && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Review Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    This analysis shows the potential impact of expediting order {currentAnalysis.targetOrder.orderNumber}. 
                    Review the trade-offs carefully before making a decision.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCommit}
                    disabled={commitChangesMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Commit Changes to Schedule
                  </Button>

                  <Button
                    onClick={handleShare}
                    disabled={shareAnalysisMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Analysis with Team
                  </Button>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start New Analysis
                  </Button>
                </div>

                <div>
                  <Label htmlFor="action-notes">Decision Notes</Label>
                  <Textarea
                    id="action-notes"
                    placeholder="Document your decision and reasoning..."
                    value={analysisNotes}
                    onChange={(e) => setAnalysisNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}