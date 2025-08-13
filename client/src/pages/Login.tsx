import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, Eye, EyeOff, PlayCircle, DollarSign, Zap, Mail, ArrowLeft, Home, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/logo";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Trial signup state
  const [trialEmail, setTrialEmail] = useState("");
  const [trialCompanyName, setTrialCompanyName] = useState("");
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState("");
  const [trialSuccess, setTrialSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("FORM SUBMIT TRIGGERED");
    console.log("Username:", username);
    console.log("Password:", password);
    setError("");
    setLoading(true);

    try {
      console.log("🚀 Calling login function...");
      const result = await login({ username, password });
      console.log("🚀 Login function returned:", result);
      console.log("🚀 About to redirect to home...");
      setLocation("/");
      console.log("🚀 Redirect completed successfully");
    } catch (error: any) {
      console.error("🚀 Login form error:", error);
      console.error("🚀 Error details:", JSON.stringify(error, null, 2));
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
    <div className="fixed inset-0 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 z-[9999]">
      <div className="max-w-md w-full space-y-6">
        {/* Back to Marketing Link */}
        <div className="flex justify-between items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/marketing-landing")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Learn More
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/solutions-comparison")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <BarChart3 className="h-4 w-4" />
            Compare
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/marketing-home")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size="large" showText={true} />
          </div>
          <p className="text-gray-600 dark:text-gray-300">AI Powered Factory Optimization</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access the production scheduling system
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Demo Accounts</DialogTitle>
                    <DialogDescription>
                      Use these accounts to test different role permissions and explore the system features.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div className="space-y-3">
                      {demoAccounts.map((account) => (
                        <div key={account.username} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{account.username}</span>
                                <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{account.role}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{account.name}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Password:</div>
                              <span className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600">••••••••</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Access & Permissions:</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{account.access}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Note:</strong> Each account provides access to different features of the manufacturing production scheduling system. 
                        All demo accounts use the same secure password. The Trainer account has comprehensive view access to all modules for demonstration purposes.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="pr-10"
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
        </Card>

        {/* Free Trial Signup */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Zap className="h-5 w-5" />
              Start Your Free Trial
            </CardTitle>
            <CardDescription>
              Get instant access to production scheduling with no setup required
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trialSuccess ? (
              <div className="text-center text-green-600">
                <p className="font-medium">Trial account created successfully!</p>
                <p className="text-sm">Logging you in...</p>
              </div>
            ) : (
              <form onSubmit={handleTrialSignup} className="space-y-4">
                {trialError && (
                  <Alert>
                    <AlertDescription className="text-red-600">
                      {trialError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <label htmlFor="trial-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="trial-email"
                    type="email"
                    value={trialEmail}
                    onChange={(e) => setTrialEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={trialLoading}
                  />
                </div>

                <div>
                  <label htmlFor="trial-company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <Input
                    id="trial-company"
                    type="text"
                    value={trialCompanyName}
                    onChange={(e) => setTrialCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    required
                    disabled={trialLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700" 
                  disabled={trialLoading}
                >
                  {trialLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Trial...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Start Free Trial
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  No credit card required • 14-day trial • Full access
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Demo Tour and Pricing */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">New to PlanetTogether?</h3>
                <p className="text-sm text-gray-600 mb-3">
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
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Explore Our Plans</h3>
                <p className="text-sm text-gray-600 mb-3">
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