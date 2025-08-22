import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Package, Truck, FileText, BarChart3, LogOut, User } from 'lucide-react';

interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  companyName: string;
  companyType: string;
}

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<PortalUser | null>(null);

  useEffect(() => {
    console.log('=== PORTAL DASHBOARD AUTH CHECK ===');
    // Check if user is logged in
    const token = localStorage.getItem('portal_token');
    const userData = localStorage.getItem('portal_user');
    
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userData);
    console.log('Current path:', window.location.pathname);
    
    if (!token || !userData) {
      console.log('No token or user data, redirecting to login');
      setLocation('/portal/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      console.log('Parsed user:', parsedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLocation('/portal/login');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    setLocation('/portal/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Partner Portal</h1>
                <p className="text-sm text-gray-500">{user.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            Access your {user.companyType} portal and manage your business with PlanetTogether.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/portal/purchase-orders')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Purchase Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                View and manage your purchase orders
              </p>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <p className="text-xs text-green-600">3 pending approval</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/portal/deliveries')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Deliveries</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Track shipments and deliveries
              </p>
              <div className="text-2xl font-bold text-gray-900">8</div>
              <p className="text-xs text-blue-600">2 in transit</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/portal/inventory')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base">Inventory</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Monitor stock levels and availability
              </p>
              <div className="text-2xl font-bold text-gray-900">248</div>
              <p className="text-xs text-yellow-600">15 low stock items</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/portal/reports')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-base">Reports & Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Analytics and performance reports
              </p>
              <div className="text-2xl font-bold text-gray-900">98%</div>
              <p className="text-xs text-green-600">On-time delivery</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">PO-2025-001</p>
                    <p className="text-sm text-gray-600">Raw Materials - Batch A</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Delivered
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">PO-2025-002</p>
                    <p className="text-sm text-gray-600">Packaging Materials</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    In Transit
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">PO-2025-003</p>
                    <p className="text-sm text-gray-600">Equipment Parts</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Processing
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Certificate of Analysis</p>
                    <p className="text-sm text-gray-600">Batch TIG-001-2025</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Quality Report</p>
                    <p className="text-sm text-gray-600">Monthly Summary</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Inspection Results</p>
                    <p className="text-sm text-gray-600">Final Product QC</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant Section */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              Max AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Need help with your orders or have questions? Max AI is here to assist you 24/7 
              with intelligent insights and support.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Chat with Max AI
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}