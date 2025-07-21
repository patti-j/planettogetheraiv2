import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Factory, Info, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username, password });
      setLocation("/");
    } catch (error) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { 
      username: "director", 
      password: "password123", 
      role: "Director", 
      name: "Sarah Johnson",
      access: "Business Goals, Strategic Planning, Reports" 
    },
    { 
      username: "plant_manager", 
      password: "password123", 
      role: "Plant Manager", 
      name: "Mike Chen",
      access: "Capacity Planning, Plant Operations, Manufacturing" 
    },
    { 
      username: "scheduler", 
      password: "password123", 
      role: "Production Scheduler", 
      name: "Emily Rodriguez",
      access: "Production Scheduling, Order Optimization, Resource Management" 
    },
    { 
      username: "admin", 
      password: "password123", 
      role: "Administrator", 
      name: "David Kim",
      access: "User Management, System Administration, Full Access" 
    },
    { 
      username: "sysmanager", 
      password: "password123", 
      role: "System Manager", 
      name: "Alex Thompson",
      access: "IT Systems, Infrastructure, Technical Management" 
    },
    { 
      username: "trainer", 
      password: "password123", 
      role: "Trainer", 
      name: "Morgan Williams",
      access: "Training System, Role Demonstrations, All Module Views" 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Factory className="text-primary mr-3" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">PlanetTogether</h1>
          </div>
          <p className="text-gray-600">Manufacturing Production Scheduler</p>
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
                    <Info className="h-4 w-4 text-gray-500" />
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
                        <div key={account.username} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-800">{account.username}</span>
                                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">{account.role}</span>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">{account.name}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">Password:</div>
                              <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">{account.password}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-1">Access & Permissions:</div>
                            <p className="text-sm text-gray-700">{account.access}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Each account provides access to different features of the manufacturing production scheduling system. 
                        The Trainer account has comprehensive view access to all modules for demonstration purposes.
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
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
      </div>
    </div>
  );
}