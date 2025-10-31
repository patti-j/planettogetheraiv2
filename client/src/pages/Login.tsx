import React, { useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Eye, EyeOff, PlayCircle, DollarSign, Zap, Mail, ArrowLeft, Home, BarChart3, Building2, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/logo";

// Lazy load heavy components to improve initial load time
const DemoAccountsCard = lazy(() => 
  import("@/components/login/DemoAccountsCard").then(module => ({ 
    default: module.DemoAccountsCard 
  }))
);

const StarterEditionCard = lazy(() => 
  import("@/components/login/StarterEditionCard").then(module => ({ 
    default: module.StarterEditionCard 
  }))
);

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const { login } = useAuth();

  // Check for existing valid session on page load
  React.useEffect(() => {
    const checkExistingSession = async () => {
      // Check if user has a valid session
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Include session cookie
        });
        if (response.ok) {
          // Session is valid, check for return URL or redirect to home page
          const returnUrl = sessionStorage.getItem('returnUrl');
          
          if (returnUrl && returnUrl !== '/login') {
            sessionStorage.removeItem('returnUrl');
            setLocation(returnUrl);
          } else {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
              setLocation('/mobile-home');
            } else {
              setLocation('/home');
            }
          }
          return;
        }
      } catch (error) {
        console.log('Session check failed');
      }
      
      // Mark page as loaded to enable login form
      setPageLoaded(true);
    };
    
    checkExistingSession();
  }, [setLocation]);
  
  // Portal login state
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalError, setPortalError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  // Trial signup state
  const [trialEmail, setTrialEmail] = useState("");
  const [trialCompanyName, setTrialCompanyName] = useState("");
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState("");
  const [trialSuccess, setTrialSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ username, password });
      
      // Session is automatically set by the server
      // Small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for stored return URL
      const returnUrl = sessionStorage.getItem('returnUrl');
      
      if (returnUrl && returnUrl !== '/login') {
        // Redirect to the original URL the user was trying to access
        console.log('Login successful, redirecting to:', returnUrl);
        sessionStorage.removeItem('returnUrl'); // Clean up
        window.location.href = returnUrl;
      } else {
        // Default behavior: Check if user is on mobile device and redirect appropriately
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          // Redirect mobile users to mobile-home
          console.log('Mobile login successful, redirecting to /mobile-home');
          window.location.href = "/mobile-home";
        } else {
          // Redirect desktop users to home page
          console.log('Desktop login successful, redirecting to /home');
          window.location.href = "/home";
        }
      }
    } catch (error: any) {
      // Extract error message from the API response
      let errorMessage = "Invalid username or password";
      
      if (error?.message) {
        // Parse error message if it contains status code and JSON
        const match = error.message.match(/\d+:\s*(.+)/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If parsing fails, extract the text after the status code
            errorMessage = match[1] || errorMessage;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePortalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError("");
    setPortalLoading(true);

    try {
      // Call portal login API
      const response = await apiRequest('POST', '/api/portal/login', {
        email: portalEmail,
        password: portalPassword
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store portal token
        localStorage.setItem('portal_token', result.token);
        localStorage.setItem('portal_user', JSON.stringify(result.user));
        
        // Redirect to portal based on user type
        const portalRoute = result.user.company?.type === 'supplier' 
          ? '/portal/supplier' 
          : result.user.company?.type === 'customer'
          ? '/portal/customer'
          : '/portal';
          
        window.location.href = portalRoute;
      } else {
        setPortalError(result.message || "Invalid email or password");
      }
    } catch (error: any) {
      console.error("Portal login error:", error);
      setPortalError("Failed to log in. Please check your credentials.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleTrialSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialEmail || !trialCompanyName) {
      setTrialError("Please fill in all fields");
      return;
    }

    setTrialError("");
    setTrialLoading(true);

    try {
      // Create trial account
      const response = await apiRequest('POST', '/api/auth/create-trial', {
        email: trialEmail,
        companyName: trialCompanyName
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTrialSuccess(true);
        // Auto-login with trial credentials
        await login({ 
          username: result.credentials.username, 
          password: result.credentials.password 
        });
        setLocation("/");
      } else {
        setTrialError(result.message || "Failed to create trial account");
      }
    } catch (error: any) {
      console.error("Trial signup error:", error);
      setTrialError("Failed to create trial account. Please try again.");
    } finally {
      setTrialLoading(false);
    }
  };

  const demoAccounts = [
    { 
      username: "director", 
      role: "Director", 
      name: "Sarah Johnson",
      access: "Business Goals, Strategic Planning, Reports" 
    },
    { 
      username: "plant_manager", 
      role: "Plant Manager", 
      name: "Mike Chen",
      access: "Capacity Planning, Plant Operations, Manufacturing" 
    },
    { 
      username: "scheduler", 
      role: "Production Scheduler", 
      name: "Emily Rodriguez",
      access: "Production Scheduling, Order Optimization, Resource Management" 
    },
    { 
      username: "admin", 
      role: "Administrator", 
      name: "David Kim",
      access: "User Management, System Administration, Full Access" 
    },
    { 
      username: "sysmanager", 
      role: "System Manager", 
      name: "Alex Thompson",
      access: "IT Systems, Infrastructure, Technical Management" 
    },
    { 
      username: "trainer", 
      role: "Trainer", 
      name: "Morgan Williams",
      access: "Training System, Role Demonstrations, All Module Views" 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-2 sm:px-4 py-2 sm:py-6 z-[9999] overflow-y-auto">
      <div className="max-w-md mx-auto w-full space-y-3 sm:space-y-6 pb-safe-bottom">
        {/* Back to Marketing Link */}
        <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 pt-safe-top">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/marketing")}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Learn More
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/solutions-comparison")}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-xs sm:text-sm"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            Compare
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/home")}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-xs sm:text-sm"
          >
            <Home className="h-3 w-3 sm:h-4 sm:w-4" />
            Home
          </Button>
        </div>

        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-4">
            <Logo size="large" showText={true} />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">AI Powered Factory Optimization</p>
        </div>

        {/* Login Form with Tabs */}
        <Card>
          <Tabs defaultValue="manufacturing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manufacturing" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Manufacturing System
              </TabsTrigger>
              <TabsTrigger value="portal" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Partner Portal
              </TabsTrigger>
            </TabsList>
            
            {/* Manufacturing System Login */}
            <TabsContent value="manufacturing">
          <CardHeader>
            <div>
              <CardTitle>Sign In - Manufacturing System</CardTitle>
              <CardDescription>
                Enter your credentials to access the production scheduling system
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="mobile-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    className="pr-10 mobile-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
            </TabsContent>
            
            {/* Portal Login */}
            <TabsContent value="portal">
              <CardHeader>
                <div>
                  <CardTitle>Sign In - Partner Portal</CardTitle>
                  <CardDescription>
                    Access the external partners portal for suppliers and customers
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <form onSubmit={handlePortalSubmit} className="space-y-3 sm:space-y-4">
                  {portalError && (
                    <Alert variant="destructive">
                      <AlertDescription>{portalError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <label htmlFor="portal-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <Input
                      id="portal-email"
                      type="email"
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      placeholder="supplier@acme.com"
                      required
                      disabled={portalLoading}
                      autoComplete="email"
                      className="mobile-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="portal-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="portal-password"
                        type={showPortalPassword ? "text" : "password"}
                        value={portalPassword}
                        onChange={(e) => setPortalPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        disabled={portalLoading}
                        className="pr-10 mobile-input"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPortalPassword(!showPortalPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        {showPortalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={portalLoading}
                  >
                    {portalLoading ? "Signing In..." : "Sign In to Portal"}
                  </Button>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                      <strong>Test Accounts:</strong><br/>
                      <span className="font-mono">supplier@acme.com</span> - Supplier Portal<br/>
                      <span className="font-mono">customer@beta.com</span> - Customer Portal<br/>
                      Password: <span className="font-mono">Test123!</span>
                    </p>
                  </div>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Starter Edition CTA - Lazy loaded */}
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
          <StarterEditionCard />
        </Suspense>

        {/* Demo Tour and Pricing */}
        <div className="space-y-2 sm:space-y-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">New to PlanetTogether?</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  Take a guided tour and see how our AI-powered platform can transform your manufacturing operations
                </p>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => setLocation("/demo-tour")}
                >
                  <PlayCircle className="h-4 w-4" />
                  Start Demo Tour
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Explore Our Plans</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  See our pricing options and find the right plan for your manufacturing operations
                </p>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => setLocation("/pricing")}
                >
                  <DollarSign className="h-4 w-4" />
                  View Pricing Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}