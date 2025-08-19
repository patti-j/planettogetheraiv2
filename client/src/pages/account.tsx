import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  User,
  CreditCard,
  Users,
  Calendar,
  Settings,
  Download,
  Bell,
  Shield,
  HelpCircle,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Crown,
  Building,
  Mail,
  Phone
} from "lucide-react";

interface AccountInfo {
  id: string;
  companyName: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise' | 'custom';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trial';
  currentUsers: number;
  maxUsers: number;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string;
  totalAmount: number;
  paymentMethod: {
    type: 'card' | 'bank';
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  features: string[];
  usage: {
    apiCalls: number;
    apiLimit: number;
    storage: number;
    storageLimit: number;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    primaryEmail: string;
    billingEmail: string;
    phone: string;
  };
  trialEndsAt?: string;
  createdAt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  maxUsers: number;
  features: string[];
  apiLimit: number;
  storageLimit: number;
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    price: 29, // $29 per user per month
    maxUsers: 5,
    features: ['Basic scheduling', 'Standard reports', 'Email support', 'Mobile app access'],
    apiLimit: 10000,
    storageLimit: 5, // GB
  },
  {
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    price: 59, // $59 per user per month
    maxUsers: 25,
    features: ['Advanced scheduling', 'Custom reports', 'Priority support', 'API access', 'Integration tools'],
    apiLimit: 50000,
    storageLimit: 25, // GB
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 89, // $89 per user per month
    maxUsers: 100,
    features: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced analytics', 'White-label options'],
    apiLimit: 200000,
    storageLimit: 100, // GB
  },
  {
    id: 'custom',
    name: 'custom',
    displayName: 'Custom Enterprise',
    price: 0, // Contact for pricing
    maxUsers: -1, // Unlimited
    features: ['Everything in Enterprise', 'Custom development', 'On-premise deployment', 'SLA guarantees'],
    apiLimit: -1, // Unlimited
    storageLimit: -1, // Unlimited
  },
];

export default function AccountPage() {
  const { toast } = useToast();
  const { isMaxOpen } = useMaxDock();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  // Fetch account information
  const { data: accountInfo, isLoading } = useQuery<AccountInfo>({
    queryKey: ['/api/account'],
  });

  // Upgrade subscription mutation
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('POST', '/api/account/upgrade', { planId });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account'] });
      setShowUpgradeDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update billing info mutation
  const updateBillingMutation = useMutation({
    mutationFn: async (billingData: any) => {
      return apiRequest('PUT', '/api/account/billing', billingData);
    },
    onSuccess: () => {
      toast({
        title: "Billing Updated",
        description: "Your billing information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account'] });
      setShowBillingDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update billing information.",
        variant: "destructive",
      });
    },
  });

  // Download invoice mutation
  const downloadInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/account/invoice/latest', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Invoice Downloaded",
        description: "Your latest invoice has been downloaded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise':
      case 'custom':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Building className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Account Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load account information. Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, billing information, and account preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Overview */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(accountInfo.subscriptionTier || 'basic')}
                Subscription Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {SUBSCRIPTION_PLANS.find(p => p.name === (accountInfo.subscriptionTier || 'basic'))?.displayName || accountInfo.subscriptionTier || 'Basic'}
                  </h3>
                  <p className="text-gray-600">{formatCurrency((accountInfo.totalAmount || 0)/(accountInfo.currentUsers || 1))}/user/{accountInfo.billingCycle === 'annual' ? 'year' : 'month'}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(accountInfo.subscriptionStatus || (accountInfo.isActive ? 'active' : 'inactive'))}
                  {accountInfo.subscriptionStatus === 'trial' && accountInfo.trialEndsAt && (
                    <p className="text-sm text-gray-600 mt-1">
                      Trial ends {formatDate(accountInfo.trialEndsAt)}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="text-lg font-semibold">
                    {accountInfo.currentUsers || 1}/{accountInfo.maxUsers === -1 ? '∞' : accountInfo.maxUsers || 'Unlimited'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Billing</p>
                  <p className="text-lg font-semibold">{accountInfo.nextBillingDate ? formatDate(accountInfo.nextBillingDate) : 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                  <DialogTrigger asChild>
                    <Button>Upgrade Plan</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Choose Your Plan</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <Card 
                          key={plan.id} 
                          className={`cursor-pointer transition-all ${
                            selectedPlan === plan.name ? 'ring-2 ring-blue-500' : ''
                          } ${plan.popular ? 'border-blue-500' : ''}`}
                          onClick={() => setSelectedPlan(plan.name)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                              {plan.popular && <Badge className="bg-blue-100 text-blue-800">Popular</Badge>}
                            </div>
                            <div className="text-2xl font-bold">
                              {plan.price === 0 ? 'Contact us' : formatCurrency(plan.price)}
                              {plan.price > 0 && <span className="text-sm font-normal">/user/month</span>}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                {plan.maxUsers === -1 ? 'Unlimited' : `Up to ${plan.maxUsers}`} users
                              </p>
                              <ul className="space-y-1">
                                {plan.features.slice(0, 3).map((feature, index) => (
                                  <li key={index} className="text-xs text-gray-600 flex items-center">
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => upgradeMutation.mutate(selectedPlan)}
                        disabled={!selectedPlan || upgradeMutation.isPending}
                      >
                        {upgradeMutation.isPending ? 'Updating...' : 'Update Plan'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={() => downloadInvoiceMutation.mutate()}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage & Limits */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Usage & Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">API Calls</span>
                  <span className="text-sm">
                    {accountInfo.usage?.apiCalls?.toLocaleString() || '0'}/{accountInfo.usage?.apiLimit === -1 ? '∞' : accountInfo.usage?.apiLimit?.toLocaleString() || 'Unlimited'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: accountInfo.usage?.apiLimit === -1 || !accountInfo.usage ? '0%' : `${Math.min(((accountInfo.usage?.apiCalls || 0) / (accountInfo.usage?.apiLimit || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-sm">
                    {(accountInfo.usage?.storage || 0).toFixed(1)} GB/{accountInfo.usage?.storageLimit === -1 ? '∞' : `${accountInfo.usage?.storageLimit || 'Unlimited'} GB`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: accountInfo.usage?.storageLimit === -1 || !accountInfo.usage ? '0%' : `${Math.min(((accountInfo.usage?.storage || 0) / (accountInfo.usage?.storageLimit || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Included Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(accountInfo.features || ['Basic Features', 'Standard Support', 'Cloud Storage']).map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <div className="flex items-center mt-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {accountInfo.paymentMethod ? (
                      <>
                        {accountInfo.paymentMethod.brand?.toUpperCase()} ****{accountInfo.paymentMethod.last4}
                      </>
                    ) : (
                      <span className="text-gray-500">No payment method on file</span>
                    )}
                  </span>
                </div>
                {accountInfo.paymentMethod?.expiryMonth && accountInfo.paymentMethod?.expiryYear && (
                  <p className="text-xs text-gray-500">
                    Expires {accountInfo.paymentMethod.expiryMonth.toString().padStart(2, '0')}/{accountInfo.paymentMethod.expiryYear}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Billing Address</p>
                <div className="text-sm mt-1">
                  {accountInfo.billingAddress ? (
                    <>
                      <p>{accountInfo.billingAddress.street}</p>
                      <p>{accountInfo.billingAddress.city}, {accountInfo.billingAddress.state} {accountInfo.billingAddress.zipCode}</p>
                      <p>{accountInfo.billingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">No billing address on file</p>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setShowBillingDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Billing
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="text-sm">{accountInfo.companyName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Primary Email</p>
                <p className="text-sm">{accountInfo.contactInfo?.primaryEmail || accountInfo.billingEmail || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Email</p>
                <p className="text-sm">{accountInfo.contactInfo?.billingEmail || accountInfo.billingEmail || 'Not specified'}</p>
              </div>
              {accountInfo.contactInfo?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm">{accountInfo.contactInfo.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Separator />
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Billing Update Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Billing Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="**** **** **** 1234" />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" placeholder="MM/YY" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" placeholder="123" />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" placeholder="12345" />
              </div>
            </div>
            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Input id="billingAddress" placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="New York" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="NY" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBillingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateBillingMutation.mutate({})}>
                Update Billing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}