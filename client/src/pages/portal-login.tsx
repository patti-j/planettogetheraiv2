import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, ArrowLeft, LogOut } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear any existing main system authentication when accessing portal
  useEffect(() => {
    console.log('=== PORTAL LOGIN LOADED ===');
    const mainAuthToken = localStorage.getItem('authToken');
    if (mainAuthToken) {
      console.log('Found main auth token, clearing for portal access:', mainAuthToken);
      // Clear main system tokens to prevent conflicts
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }, []);

  const clearMainAuth = () => {
    console.log('=== CLEARING MAIN AUTH FOR PORTAL ===');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Also clear any API cache
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setError('');
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
        credentials: 'include'
      });

      console.log('=== LOGIN RESPONSE ===', response.status, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('=== LOGIN RESULT ===', result);
        
        if (result && result.token && result.user) {
          console.log('=== LOGIN SUCCESS - STORING TOKENS ===');
          localStorage.setItem('portal_token', result.token);
          localStorage.setItem('portal_user', JSON.stringify(result.user));
          console.log('=== REDIRECTING TO DASHBOARD ===');
          setLocation('/portal/dashboard');
        } else {
          console.log('=== LOGIN FAILED - MISSING DATA ===', result);
          setError('Invalid login response - missing token or user data');
        }
      } else {
        console.log('=== LOGIN FAILED - BAD RESPONSE ===', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.log('=== ERROR DATA ===', errorData);
        setError(errorData.error || `Login failed (${response.status})`);
      }
    } catch (err) {
      console.log('=== LOGIN CATCH ERROR ===', err);
      setError('Network error - please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">Partner Portal</CardTitle>
          </div>
          <CardDescription>
            Sign in to access your PlanetTogether partner dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email or Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
            <p className="mb-2">For testing, you can use:</p>
            <div className="space-y-1 text-xs">
              <p><strong>Email:</strong> jim.cerra@planettogether.com</p>
              <p><strong>Email:</strong> supplier@acme.com</p>
              <p><strong>Password:</strong> Test123!</p>
            </div>
          </div>

          <div className="mt-4 text-center space-y-2">
            <Button
              variant="outline"
              className="text-sm w-full"
              onClick={clearMainAuth}
              type="button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Clear Main System Login
            </Button>
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => setLocation('/login')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}