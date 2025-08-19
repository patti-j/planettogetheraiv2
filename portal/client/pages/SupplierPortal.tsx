import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, Truck, FileText, TrendingUp, AlertCircle, 
  Calendar, Clock, CheckCircle, XCircle, Upload,
  BarChart3, Users, ShoppingCart, DollarSign 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function SupplierPortal() {
  const [location] = useLocation();
  const { company, token } = useAuth();
  const { toast } = useToast();

  // Fetch purchase orders
  const { data: purchaseOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/portal/supplier/purchase-orders'],
    enabled: !!token,
  });

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/portal/dashboard'],
    enabled: !!token,
  });

  const handleDeliveryUpdate = async (orderId: string) => {
    toast({
      title: 'Delivery Update',
      description: 'Opening delivery update form...',
    });
  };

  const handleDocumentUpload = async (orderId: string) => {
    toast({
      title: 'Document Upload',
      description: 'Opening document upload dialog...',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
          <p className="text-muted-foreground">{company?.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pendingOrders || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.onTimeRate || 95}%</div>
            <Progress value={metrics?.onTimeRate || 95} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.qualityScore || 98}%</div>
            <p className="text-xs text-green-600">+2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue MTD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.revenueMtd || '125,000'}</div>
            <p className="text-xs text-muted-foreground">Target: $150,000</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Purchase Orders</CardTitle>
              <CardDescription>
                Manage your purchase orders and delivery schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {ordersLoading ? (
                    <p>Loading orders...</p>
                  ) : purchaseOrders?.length > 0 ? (
                    purchaseOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">PO-{order.id}</h4>
                            <Badge variant={
                              order.status === 'urgent' ? 'destructive' : 
                              order.status === 'confirmed' ? 'default' : 
                              'secondary'
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.itemCount} items • Due: {new Date(order.dueDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="flex items-center">
                              <Package className="w-4 h-4 mr-1" />
                              {order.productName}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {order.quantity} units
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeliveryUpdate(order.id)}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Update Delivery
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentUpload(order.id)}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload Docs
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No active purchase orders</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Schedule</CardTitle>
              <CardDescription>
                Track and manage your upcoming deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Today's Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">PO-2345</span>
                          <Badge variant="default">In Transit</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">PO-2346</span>
                          <Badge variant="outline">Scheduled</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">12 deliveries scheduled</span>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">3 pending confirmation</span>
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Documents</CardTitle>
              <CardDescription>
                Manage certificates, test results, and compliance documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Upload Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here or click to browse
                </p>
                <Button>Select Files</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Track your performance and identify improvement areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>On-Time Delivery Rate</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">95%</span>
                    <Progress value={95} className="w-24" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quality Acceptance Rate</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">98%</span>
                    <Progress value={98} className="w-24" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Documentation Compliance</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">100%</span>
                    <Progress value={100} className="w-24" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response Time (hours)</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">2.5</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}