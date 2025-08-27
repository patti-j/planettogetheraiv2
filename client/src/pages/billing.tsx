import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Download,
  Settings,
  Bell,
  Database,
  Bot,
  Cpu,
  Cloud,
  DollarSign,
  BarChart3,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UsageMetric {
  id: string;
  name: string;
  current: number;
  limit: number;
  unit: string;
  overageRate: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

interface BillingPeriod {
  id: string;
  period: string;
  status: "current" | "upcoming" | "past";
  totalCost: number;
  baseCost: number;
  usageCost: number;
  dueDate: string;
}

export default function Billing() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const { toast } = useToast();

  const currentUsage: UsageMetric[] = [
    {
      id: "data-processing",
      name: "Data Processing",
      current: 87500,
      limit: 100000,
      unit: "records",
      overageRate: "$0.05/1K",
      icon: <Database className="w-5 h-5" />,
      trend: "up",
      trendValue: 12.5
    },
    {
      id: "ai-requests",
      name: "AI Requests",
      current: 3420,
      limit: 5000,
      unit: "requests",
      overageRate: "$0.10/request",
      icon: <Sparkles className="w-5 h-5" />,
      trend: "up",
      trendValue: 8.2
    },
    {
      id: "optimization-runs",
      name: "Optimization Runs",
      current: 23,
      limit: 100,
      unit: "runs",
      overageRate: "$2.50/run",
      icon: <Cpu className="w-5 h-5" />,
      trend: "stable",
      trendValue: 0
    },
    {
      id: "storage",
      name: "Storage Usage",
      current: 78.3,
      limit: 100,
      unit: "GB",
      overageRate: "$0.25/GB",
      icon: <Cloud className="w-5 h-5" />,
      trend: "up",
      trendValue: 5.1
    }
  ];

  const billingHistory: BillingPeriod[] = [
    {
      id: "current",
      period: "January 2025",
      status: "current",
      totalCost: 4284.75,
      baseCost: 3750.00,
      usageCost: 534.75,
      dueDate: "2025-02-01"
    },
    {
      id: "upcoming",
      period: "February 2025",
      status: "upcoming",
      totalCost: 4500.00,
      baseCost: 3750.00,
      usageCost: 750.00,
      dueDate: "2025-03-01"
    },
    {
      id: "dec2024",
      period: "December 2024",
      status: "past",
      totalCost: 3912.50,
      baseCost: 3750.00,
      usageCost: 162.50,
      dueDate: "2025-01-01"
    }
  ];

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    return "bg-blue-500";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleDownloadInvoice = (periodId: string) => {
    toast({
      title: "Downloading Invoice",
      description: "Your invoice is being prepared for download...",
    });
  };

  const handleSetUsageAlert = (metricId: string) => {
    toast({
      title: "Usage Alert Set",
      description: "You'll be notified when usage reaches 80% of limit.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Billing & Usage</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor your usage, manage billing, and control costs</p>
        </div>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="usage">Current Usage</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
            <TabsTrigger value="alerts">Usage Alerts</TabsTrigger>
            <TabsTrigger value="settings">Billing Settings</TabsTrigger>
          </TabsList>

          {/* Current Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            {/* Usage Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentUsage.map((metric) => (
                <Card key={metric.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          {metric.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{metric.name}</h3>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetUsageAlert(metric.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${getUsageColor(metric.current, metric.limit)}`}>
                          {formatNumber(metric.current)}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {formatNumber(metric.limit)} {metric.unit}
                        </span>
                      </div>

                      <Progress 
                        value={(metric.current / metric.limit) * 100} 
                        className="h-2"
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {((metric.current / metric.limit) * 100).toFixed(1)}% used
                        </span>
                        <div className="flex items-center space-x-1">
                          {metric.trend === "up" && <TrendingUp className="w-3 h-3 text-red-500" />}
                          {metric.trend === "down" && <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />}
                          {metric.trend === "stable" && <div className="w-3 h-0.5 bg-gray-400" />}
                          <span className={`text-xs ${
                            metric.trend === "up" ? "text-red-500" : 
                            metric.trend === "down" ? "text-green-500" : "text-gray-500"
                          }`}>
                            {metric.trend === "stable" ? "0%" : `${metric.trendValue}%`}
                          </span>
                        </div>
                      </div>

                      {metric.current > metric.limit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-700">
                              Overage: {formatNumber(metric.current - metric.limit)} {metric.unit} at {metric.overageRate}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Usage Projections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Usage Projections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">End of Month Forecast</h4>
                    <div className="space-y-3">
                      {currentUsage.map((metric) => {
                        const projectedUsage = Math.round(metric.current * 1.15); // 15% growth projection
                        const willExceed = projectedUsage > metric.limit;
                        return (
                          <div key={metric.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{metric.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${willExceed ? "text-red-600" : "text-gray-900"}`}>
                                {formatNumber(projectedUsage)} {metric.unit}
                              </span>
                              {willExceed && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Estimated Additional Costs</h4>
                    <div className="space-y-3">
                      {currentUsage.map((metric) => {
                        const projectedUsage = Math.round(metric.current * 1.15);
                        const overage = Math.max(0, projectedUsage - metric.limit);
                        const overageCost = overage * parseFloat(metric.overageRate.replace(/[^0-9.]/g, ''));
                        return (
                          <div key={metric.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{metric.name}</span>
                            <span className={`text-sm font-medium ${overageCost > 0 ? "text-red-600" : "text-green-600"}`}>
                              {overageCost > 0 ? `+$${overageCost.toFixed(2)}` : "$0.00"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {billingHistory.map((period) => (
                <Card key={period.id} className={`${
                  period.status === "current" ? "ring-2 ring-blue-500" : ""
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{period.period}</CardTitle>
                      <Badge variant={
                        period.status === "current" ? "default" :
                        period.status === "upcoming" ? "secondary" : "outline"
                      }>
                        {period.status === "current" ? "Current" :
                         period.status === "upcoming" ? "Upcoming" : "Paid"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Subscription</span>
                        <span className="text-sm font-medium">${period.baseCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Usage Charges</span>
                        <span className="text-sm font-medium">${period.usageCost.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold text-lg">${period.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Due: {period.dueDate}</span>
                      {period.status === "past" && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(period.id)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                      {period.status !== "past" && (
                        <Button size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Usage Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Alert Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Get notified when your usage approaches limits to avoid unexpected charges.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentUsage.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        {metric.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{metric.name}</h4>
                        <p className="text-sm text-gray-600">Current: {formatNumber(metric.current)} / {formatNumber(metric.limit)} {metric.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">Alert at 80%</div>
                        <div className="text-xs text-gray-500">{formatNumber(Math.round(metric.limit * 0.8))} {metric.unit}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-gray-600">Expires 12/27</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email invoices</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Usage notifications</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-pay</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}