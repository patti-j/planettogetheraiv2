import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTour } from "@/contexts/TourContext";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PlayCircle, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingData {
  id: number;
  companyName: string;
  industry: string;
  size: string;
  currentStep: string;
  completedSteps: string[];
  selectedFeatures: string[];
  isCompleted: boolean;
}

interface OnboardingGateProps {
  children: React.ReactNode;
}

/**
 * OnboardingGate component enforces mandatory onboarding flow for new users.
 * Users cannot access other features until they complete company info and feature selection.
 * Allows bypass only when users are actively taking a tour.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isActive: isTourActive, startTour } = useTour();
  const [location, setLocation] = useLocation();
  const [shouldEnforceOnboarding, setShouldEnforceOnboarding] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  // Get onboarding status for authenticated users
  const { data: onboardingData, isLoading: onboardingLoading } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user && (location !== '/onboarding' && !location.startsWith('/onboarding?'))
  }) as { data: OnboardingData | undefined, isLoading: boolean };

  // Check if user should see onboarding on first login (but don't force it)
  useEffect(() => {
    if (authLoading || onboardingLoading) {
      return; // Still loading, don't make decisions yet
    }

    if (!user) {
      setShouldEnforceOnboarding(false);
      return; // Not authenticated, no onboarding required
    }

    // Never enforce onboarding - users can always navigate freely
    // Only redirect new users to onboarding on first login if they're on the dashboard
    // Skip enforcement for home navigation 
    if (!onboardingData && (location === '/dashboard')) {
      // No onboarding data exists and user is on dashboard page - redirect to onboarding once
      setShouldEnforceOnboarding(true);
      return;
    }

    // For all other cases, allow free navigation
    setShouldEnforceOnboarding(false);
  }, [user, onboardingData, isTourActive, location, authLoading, onboardingLoading]);

  // Redirect to onboarding if enforcement is active
  useEffect(() => {
    if (shouldEnforceOnboarding && location !== '/onboarding') {
      console.log('Enforcing onboarding flow, redirecting from:', location);
      setLocation('/onboarding');
    }
  }, [shouldEnforceOnboarding, location, setLocation]);

  // Handle starting a free trial
  const handleStartFreeTrial = async () => {
    if (!user) return;
    
    setIsStartingTrial(true);
    try {
      // Create minimal onboarding data for trial
      const trialData = {
        companyName: "Trial Company",
        industry: "trial",
        size: "small",
        selectedFeatures: ["production-scheduling"], // Basic feature for trial
        isCompleted: true
      };

      await apiRequest('PUT', '/api/onboarding', trialData);
      
      // Navigate to dashboard to start trial
      setLocation('/');
    } catch (error) {
      console.error('Failed to start trial:', error);
    } finally {
      setIsStartingTrial(false);
    }
  };

  // Show subtle loading state in content area only
  // Don't show loading state if user is on the onboarding page itself
  if (authLoading || (user && onboardingLoading && location !== '/onboarding' && !location.startsWith('/onboarding?'))) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If onboarding is required and we're not in a tour, show onboarding message in content area
  if (shouldEnforceOnboarding && !isTourActive) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to PlanetTogether</h2>
          <p className="text-gray-600">
            Complete your company setup and select the features you'd like to use to access the system.
            Not sure which features you need? Take a tour to explore and learn more.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setLocation('/onboarding')}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Complete Getting Started
            </button>
            <button
              onClick={() => {
                // Start a demo tour to help users learn about features
                // Use Production Scheduler role as default for feature exploration
                startTour(3, true, 'demo');
              }}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Take a Tour First
            </button>
            <button
              onClick={handleStartFreeTrial}
              disabled={isStartingTrial}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isStartingTrial ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {isStartingTrial ? 'Starting Trial...' : 'Start Free Trial'}
            </button>
            <p className="text-sm text-gray-500 text-center">
              The tour helps you explore features, or start a trial to jump right in
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Allow access to the application
  return <>{children}</>;
}