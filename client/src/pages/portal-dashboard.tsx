import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, TruckIcon, FileText, BarChart3, LogOut } from 'lucide-react';

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user info from localStorage
    const portalUser = localStorage.getItem('portal_user');
    if (portalUser) {
      setUser(JSON.parse(portalUser));
    } else {
      // Redirect to login if no user found
      setLocation('/portal/login');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    setLocation('/portal/login');
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const features = [
    {
      title: 'Purchase Orders',
      description: 'View and manage your purchase orders',
      icon: Package,
      count: '12 Active',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Deliveries',
      description: 'Track delivery schedules and status',
      icon: TruckIcon,
      count: '3 Pending',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Quality Documents',
      description: 'Access certificates and test reports',
      icon: FileText,
      count: '8 Documents',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Performance Metrics',
      description: 'View your performance dashboard',
      icon: BarChart3,
      count: '98% Rating',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">Partner Portal</h1>
                <p className="text-sm text-gray-600">{user.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <Badge variant="secondary" className="text-xs">{user.role}</Badge>
              </div>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h2>
          <p className="text-gray-600 mt-1">
            Manage your partnership with PlanetTogether from your personalized dashboard.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <Badge variant="outline">{feature.count}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Assistant Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              Max AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Your AI-powered assistant is ready to help with orders, deliveries, and insights.
            </p>
            <Button>
              Chat with Max AI
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Purchase Order #PO-2025-0123 updated</p>
                  <p className="text-sm text-gray-600">Delivery scheduled for August 25, 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Quality certificate uploaded</p>
                  <p className="text-sm text-gray-600">Certificate for batch #B20250820 approved</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <TruckIcon className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Delivery completed</p>
                  <p className="text-sm text-gray-600">Shipment #SH-789 delivered on time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}