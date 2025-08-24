import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Clock, Package, AlertCircle, TrendingUp, 
  Users, Factory, CheckCircle2, AlertTriangle, BarChart3, 
  Activity, Target, Briefcase, DollarSign, ArrowRight,
  Star, MessageCircle, Bell, Settings, Layout, Edit3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLocation } from 'wouter';

import { useDeviceType } from '@/hooks/useDeviceType';
import { CustomizableHomeDashboard } from '@/components/customizable-home-dashboard';
import { HomeDashboardCustomizer } from '@/components/home-dashboard-customizer';

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { recentPages } = useNavigation();
  const isMobile = useDeviceType() === 'mobile';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [useCustomDashboard, setUseCustomDashboard] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Query for production metrics
  const { data: productionOrders } = useQuery({
    queryKey: ['/api/pt-jobs'],
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: operations } = useQuery({
    queryKey: ['/api/operations'],
    refetchInterval: 60000
  });

  const { data: resources } = useQuery({
    queryKey: ['/api/resources'],
    refetchInterval: 60000
  });

  // Calculate metrics
  const activeOrders = (productionOrders as any[])?.filter((order: any) => order.status === 'in_progress').length || 0;
  const completedToday = (productionOrders as any[])?.filter((order: any) => {
    const completedDate = new Date(order.actualCompletionDate);
    const today = new Date();
    return order.status === 'completed' && 
           completedDate.toDateString() === today.toDateString();
  }).length || 0;
  
  const operationsInProgress = (operations as any[])?.filter((op: any) => op.status === 'in_progress').length || 0;
  const delayedOperations = (operations as any[])?.filter((op: any) => op.status === 'delayed').length || 0;
  const resourceUtilization = (resources as any[]) ? Math.round(((resources as any[]).filter((r: any) => r.currentStatus === 'busy').length / (resources as any[]).length) * 100) : 0;

  // Quick access links based on user role
  const getQuickLinks = () => {
    const links = [
      { icon: BarChart3, label: 'Production Scheduling', href: '/production-schedule', color: 'bg-blue-500' },
      { icon: Activity, label: 'Analytics', href: '/analytics', color: 'bg-purple-500' },
      { icon: Package, label: 'Shop Floor', href: '/shop-floor', color: 'bg-orange-500' },
      { icon: Briefcase, label: 'Capacity Planning', href: '/capacity-planning', color: 'bg-green-500' },
      { icon: Target, label: 'Production Planning', href: '/production-planning', color: 'bg-indigo-500' },
      { icon: Settings, label: 'System Management', href: '/systems-management-dashboard', color: 'bg-gray-500' }
    ];
    return links;
  };

  const quickLinks = getQuickLinks();

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Header */}
      <div className={`border-b ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseCustomDashboard(!useCustomDashboard)}
              className="gap-2"
            >
              <Layout className="w-4 h-4" />
              {useCustomDashboard ? 'Standard View' : 'Custom Dashboard'}
            </Button>
            {useCustomDashboard && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomizing(true)}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Customize
              </Button>
            )}
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
        {useCustomDashboard ? (
          <CustomizableHomeDashboard />
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
          
          {/* Key Metrics Section */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Today's Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold">{activeOrders}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Activity className="w-3 h-3 mr-1" />
                      In Progress
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600">{completedToday}</p>
                    <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      On Track
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Operations Running</p>
                    <p className="text-2xl font-bold">{operationsInProgress}</p>
                    {delayedOperations > 0 && (
                      <Badge variant="destructive" className="mt-1">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {delayedOperations} Delayed
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resource Utilization</p>
                    <p className="text-2xl font-bold">{resourceUtilization}%</p>
                    <Badge variant={resourceUtilization > 80 ? "destructive" : resourceUtilization > 60 ? "secondary" : "outline"} className="mt-1">
                      <Factory className="w-3 h-3 mr-1" />
                      {resourceUtilization > 80 ? "High" : resourceUtilization > 60 ? "Optimal" : "Low"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 xl:grid-cols-3'}`}>
                  {quickLinks.map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3 px-3 flex-wrap min-h-[3rem]"
                      onClick={() => setLocation(link.href)}
                    >
                      <div className={`w-8 h-8 rounded-lg ${link.color} flex items-center justify-center flex-shrink-0`}>
                        <link.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-left leading-tight`}>
                        {link.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm">New production order created</p>
                      <p className="text-xs text-muted-foreground">PO-2025-004 - 5 min ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm">Schedule approved</p>
                      <p className="text-xs text-muted-foreground">Weekly production plan - 1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm">Resource maintenance scheduled</p>
                      <p className="text-xs text-muted-foreground">CNC Machine 1 - 2 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Notifications */}
            {delayedOperations > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{delayedOperations} Delayed Operations</span>
                      <Button size="sm" variant="outline" onClick={() => setLocation('/production-schedule')}>
                        View
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Pages */}
            {recentPages && recentPages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
                    Recently Visited
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentPages.slice(0, 5).map((page, index) => {
                      // Handle icon - it could be a string name, component, or empty/invalid
                      const IconComponent = typeof page.icon === 'string' 
                        ? null // Icon names as strings aren't directly renderable
                        : (typeof page.icon === 'function' ? page.icon : null);
                      
                      return (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start gap-2 h-8"
                          onClick={() => setLocation(page.path)}
                        >
                          {IconComponent && typeof IconComponent === 'function' && <IconComponent className="w-4 h-4" />}
                          <span className="text-sm">{page.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Home Dashboard Customizer Modal */}
      {isCustomizing && (
        <HomeDashboardCustomizer
          open={isCustomizing}
          onOpenChange={setIsCustomizing}
          currentLayout={null}
          onLayoutUpdate={() => {}}
        />
      )}
    </div>
  );
}