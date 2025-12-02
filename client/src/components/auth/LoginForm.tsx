import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoginPending, loginError } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">PlanetTogether</CardTitle>
          <CardDescription className="text-center">
            Sign in to your manufacturing management account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Invalid username or password. Please try again.
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoginPending}>
              <LogIn className="w-4 h-4 mr-2" />
              {isLoginPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">Demo Accounts Available:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>director</strong> (Business Goals & Analytics)</div>
              <div><strong>plant_manager</strong> (Capacity Planning)</div>
              <div><strong>scheduler</strong> (Production Scheduling)</div>
              <div><strong>admin</strong> (User Management)</div>
              <div><strong>sysmanager</strong> (Systems Management)</div>
            </div>
            <p className="text-xs text-blue-600 mt-2 italic">All demo accounts use the same secure password.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-0">
          <div className="w-full flex flex-col space-y-2">
            <Link href="/home">
              <Button variant="outline" className="w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
                Learn About PlanetTogether
              </Button>
            </Link>
            <Link href="/solutions-comparison">
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare Solutions
              </Button>
            </Link>
          </div>
          <p className="text-xs text-center text-gray-500">
            Explore our features without signing in
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}