import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting portal login for:', email);
      const result = await apiRequest('/api/portal/login', 'POST', {
        email: email,
        password: password
      }) as { token: string; user: any };
      
      console.log('Portal login response:', result);
      
      if (result.token && result.user) {
        // Store the portal token and user info
        localStorage.setItem('portal_token', result.token);
        localStorage.setItem('portal_user', JSON.stringify(result.user));
        
        // Redirect to portal dashboard
        setLocation('/portal/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      console.log('Portal login error:', err);
      setError(err.message || 'Login failed. Please try again.');
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

          <div className="mt-4 text-center">
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