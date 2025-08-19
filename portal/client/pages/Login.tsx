import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Package, Truck, Factory } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${result.user.firstName || result.user.email}`,
        });
        
        // Redirect based on company type and onboarding status
        if (!result.company.aiOnboardingComplete) {
          setLocation('/portal/onboarding');
        } else {
          setLocation(`/portal/${result.company.type}/dashboard`);
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Portal</h1>
          <p className="text-gray-600 mt-2">Access your PlanetTogether account</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your partner portal
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@company.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between text-sm">
                  <a
                    href="/portal/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  New to the portal?
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/portal/register')}
            >
              Request Access
            </Button>

            {/* Portal Types Info */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Suppliers</span>
              </div>
              <div className="text-center">
                <Package className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Customers</span>
              </div>
              <div className="text-center">
                <Factory className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">OEMs</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          © 2025 PlanetTogether. All rights reserved.
        </p>
      </div>
    </div>
  );
}