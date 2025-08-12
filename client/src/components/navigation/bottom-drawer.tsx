import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Bell, Activity, CheckCircle2, AlertCircle, Info, Clock, User, Package, Truck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

interface ActivityItem {
  id: string;
  type: 'activity' | 'alert' | 'approval' | 'notification';
  icon: 'info' | 'success' | 'warning' | 'error' | 'user' | 'package' | 'truck';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  actionRequired?: boolean;
  status?: 'pending' | 'completed' | 'failed';
}

export function BottomDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [unreadCount, setUnreadCount] = useState(12);

  // Listen for toggle event from command palette or other components
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    document.addEventListener('toggle-bottom-drawer', handleToggle);
    return () => document.removeEventListener('toggle-bottom-drawer', handleToggle);
  }, []);

  // Mock activity data - in production, this would come from the backend
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'activity',
      icon: 'package',
      title: 'Production Order Started',
      description: 'Order PO-2025-003 has started production on Line A',
      timestamp: 'Just now',
      user: 'System'
    },
    {
      id: '2',
      type: 'alert',
      icon: 'warning',
      title: 'Quality Alert',
      description: 'Batch B-2025-142 failed quality inspection at checkpoint 3',
      timestamp: '5 minutes ago',
      actionRequired: true,
      status: 'pending'
    },
    {
      id: '3',
      type: 'approval',
      icon: 'info',
      title: 'Schedule Change Approval Required',
      description: 'Jim Doe requested to reschedule Order PO-2025-004',
      timestamp: '15 minutes ago',
      user: 'Jim Doe',
      actionRequired: true,
      status: 'pending'
    },
    {
      id: '4',
      type: 'notification',
      icon: 'success',
      title: 'Maintenance Completed',
      description: 'Preventive maintenance on CNC Machine 1 completed successfully',
      timestamp: '30 minutes ago',
      status: 'completed'
    },
    {
      id: '5',
      type: 'activity',
      icon: 'truck',
      title: 'Material Delivery',
      description: 'Raw materials for Order PO-2025-005 have arrived at receiving dock',
      timestamp: '45 minutes ago',
      user: 'Warehouse Team'
    },
    {
      id: '6',
      type: 'alert',
      icon: 'error',
      title: 'Resource Conflict',
      description: 'Double booking detected for Assembly Line B at 14:00',
      timestamp: '1 hour ago',
      actionRequired: true,
      status: 'pending'
    },
    {
      id: '7',
      type: 'notification',
      icon: 'info',
      title: 'Report Generated',
      description: 'Daily production report is ready for review',
      timestamp: '2 hours ago'
    },
    {
      id: '8',
      type: 'activity',
      icon: 'user',
      title: 'User Login',
      description: 'Sarah Johnson logged in from Production Floor Terminal',
      timestamp: '3 hours ago',
      user: 'Sarah Johnson'
    }
  ];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'info': return Info;
      case 'user': return User;
      case 'package': return Package;
      case 'truck': return Truck;
      default: return Activity;
    }
  };

  const getIconColor = (iconType: string) => {
    switch (iconType) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'info': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const pendingApprovals = mockActivities.filter(a => a.type === 'approval' && a.status === 'pending');
  const alerts = mockActivities.filter(a => a.type === 'alert');
  const notifications = mockActivities.filter(a => a.type === 'notification');

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background border-t transition-all duration-300 z-40",
      isOpen ? "h-80" : "h-10"
    )}>
      {/* Handle bar */}
      <div 
        className="h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Activity Center</span>
          </div>
          {!isOpen && (
            <>
              <Badge variant="default" className="h-5">
                {unreadCount} new
              </Badge>
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="h-5">
                  {pendingApprovals.length} approvals pending
                </Badge>
              )}
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Drawer content */}
      {isOpen && (
        <div className="h-[calc(100%-2.5rem)] flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger value="activity" className="relative">
                  Activity
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="alerts" className="relative">
                  Alerts
                  {alerts.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-4 px-1">
                      {alerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approvals" className="relative">
                  Approvals
                  {pendingApprovals.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-4 px-1">
                      {pendingApprovals.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-4">
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-2 max-w-4xl">
                  {mockActivities.map(activity => {
                    const Icon = getIcon(activity.icon);
                    return (
                      <Card key={activity.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={cn("mt-0.5", getIconColor(activity.icon))}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {activity.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                            {activity.user && (
                              <p className="text-xs text-muted-foreground mt-1">By: {activity.user}</p>
                            )}
                            {activity.actionRequired && (
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" className="h-6 text-xs">
                                  View Details
                                </Button>
                                <Button size="sm" className="h-6 text-xs">
                                  Take Action
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="mt-4">
                <div className="space-y-2 max-w-4xl">
                  {alerts.map(alert => {
                    const Icon = getIcon(alert.icon);
                    return (
                      <Card key={alert.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border-orange-200">
                        <div className="flex items-start gap-3">
                          <div className={cn("mt-0.5", getIconColor(alert.icon))}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">{alert.title}</h4>
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-6 text-xs">
                                  Dismiss
                                </Button>
                                <Button size="sm" className="h-6 text-xs">
                                  Resolve
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="approvals" className="mt-4">
                <div className="space-y-2 max-w-4xl">
                  {pendingApprovals.map(approval => (
                    <Card key={approval.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-blue-500">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{approval.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{approval.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Requested by: {approval.user}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground">{approval.timestamp}</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                Reject
                              </Button>
                              <Button size="sm" className="h-7 text-xs">
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending approvals</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-4">
                <div className="space-y-2 max-w-4xl">
                  {notifications.map(notification => {
                    const Icon = getIcon(notification.icon);
                    return (
                      <Card key={notification.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={cn("mt-0.5", getIconColor(notification.icon))}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">{notification.title}</h4>
                              {notification.status === 'completed' && (
                                <Badge variant="secondary" className="text-xs">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                            <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Quick actions bar */}
          <div className="border-t px-4 py-2">
            <div className="flex items-center justify-between max-w-4xl">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Bell className="w-3 h-3 mr-1" />
                  Mark all as read
                </Button>
                <Button variant="outline" size="sm">
                  Clear completed
                </Button>
              </div>
              <Button variant="link" size="sm" className="text-xs">
                View all activity →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}