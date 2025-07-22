import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTour } from "@/contexts/TourContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { 
  Factory, 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings, 
  Play, 
  Target,
  BarChart3,
  Smartphone,
  Building,
  GraduationCap,
  ArrowRight,
  Info,
  Server,
  Wrench,
  User,
  Mail,
  Building2,
  Briefcase,
  Volume2
} from "lucide-react";

const participantFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"), 
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  primaryRole: z.string().min(1, "Primary role is required"),
  additionalRoles: z.array(z.string()).default([]),
  referralSource: z.string().optional(),
  voiceNarrationEnabled: z.boolean().default(false),
});

type ParticipantFormData = z.infer<typeof participantFormSchema>;

interface Role {
  id: string;
  name: string;
  description: string;
  icon: any;
  primaryColor: string;
}

export default function DemoTour() {
  const [, setLocation] = useLocation();
  const [showParticipantForm, setShowParticipantForm] = useState(true);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [demoRole, setDemoRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startTour } = useTour();

  // Tour is now managed globally by TourContext
  // No need for local tour state management

  // Add comprehensive error and navigation debugging
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Page error:", event.error, event.filename, event.lineno);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
    };

    // Track all navigation changes
    const handlePopstate = (event: PopStateEvent) => {
      console.log("Navigation change detected:", {
        url: window.location.href,
        pathname: window.location.pathname,
        state: event.state
      });
    };

    // Track fetch errors that might be 404s
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 404) {
          console.error("404 Error detected in fetch:", {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      } catch (error) {
        console.error("Fetch error:", error, "URL:", args[0]);
        throw error;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('popstate', handlePopstate);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('popstate', handlePopstate);
      window.fetch = originalFetch;
    };
  }, []);

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      jobTitle: "",
      primaryRole: "",
      additionalRoles: [],
      referralSource: "",
    },
  });

  const roles: Role[] = [
    {
      id: "director",
      name: "Director/Executive",
      description: "CEO, COO, Plant Director - Strategic oversight and business performance",
      icon: TrendingUp,
      primaryColor: "blue",
    },
    {
      id: "plant-manager",
      name: "Plant Manager",
      description: "Operations Manager, Plant Director - Facility oversight and capacity management",
      icon: Building,
      primaryColor: "purple",
    },
    {
      id: "production-scheduler",
      name: "Production Scheduler",
      description: "Production Planner, Scheduler - Daily scheduling and resource optimization",
      icon: Calendar,
      primaryColor: "green",
    },
    {
      id: "it-administrator",
      name: "IT Administrator",
      description: "IT Manager, System Administrator - System configuration and user management",
      icon: Settings,
      primaryColor: "orange",
    },
    {
      id: "systems-manager",
      name: "Systems Manager",
      description: "IT systems oversight, security management, and infrastructure monitoring",
      icon: Server,
      primaryColor: "indigo",
    },
    {
      id: "administrator",
      name: "Administrator",
      description: "Full system access with all permissions across all features",
      icon: Users,
      primaryColor: "red",
    },
    {
      id: "shop-floor-operations",
      name: "Shop Floor Operations",
      description: "Shop floor supervision with operator oversight and maintenance coordination",
      icon: Factory,
      primaryColor: "yellow",
    },
    {
      id: "data-analyst",
      name: "Data Analyst",
      description: "Production data analysis and reporting specialist",
      icon: BarChart3,
      primaryColor: "teal",
    },
    {
      id: "trainer",
      name: "Trainer",
      description: "Training coordination and demonstration management",
      icon: GraduationCap,
      primaryColor: "pink",
    },
    {
      id: "maintenance-technician",
      name: "Maintenance Technician",
      description: "Equipment maintenance with work order and scheduling access",
      icon: Wrench,
      primaryColor: "gray",
    }
  ];

  const createParticipantMutation = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      const response = await apiRequest("POST", "/api/demo-tour-participants", data);
      return await response.json();
    },
    onSuccess: (participant) => {
      console.log("Participant created:", participant);
      setParticipantId(participant.id);
      toast({
        title: "Registration Complete!",
        description: "Let's start your personalized demo tour.",
      });
      setShowParticipantForm(false);
      startDemoTour(participant.primaryRole, participant.voiceNarrationEnabled);
    },
    onError: (error) => {
      console.error("Error creating participant:", error);
      toast({
        title: "Registration Error",
        description: "Failed to register for demo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startDemoTour = async (primaryRole: string, voiceEnabledParam = false) => {
    try {
      console.log("Starting demo tour with role:", primaryRole);
      
      // First, clear any existing authentication to prevent conflicts
      console.log("Clearing existing authentication before demo...");
      
      // Clear localStorage token
      localStorage.removeItem("authToken");
      
      // Clear any existing session by calling logout
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        console.log("Existing session cleared");
      } catch (logoutError) {
        console.log("No existing session to clear");
      }
      
      // Clear React Query cache
      queryClient.clear();
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now authenticate as demo user for the selected role
      console.log("Starting fresh demo authentication...");
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: primaryRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to start demo");
      }

      const data = await response.json();
      
      // Store demo token in localStorage
      localStorage.setItem("authToken", data.token);
      console.log("Demo token stored, starting tour...");
      
      // Invalidate auth cache to refresh authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Wait for authentication to be established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start guided tour using global context
      setDemoRole(primaryRole);
      startTour(primaryRole, voiceEnabledParam);
      console.log("Demo tour started globally for role:", primaryRole, "with voice:", voiceEnabledParam);
      
      // Use proper navigation instead of window.location to avoid 404
      setLocation("/");
      
    } catch (error) {
      console.error("Demo login error:", error);
      toast({
        title: "Demo Error",
        description: "Failed to start demo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: ParticipantFormData) => {
    console.log("Form submission data:", data);
    createParticipantMutation.mutate(data);
  };

  // Tour completion and skip handling is now managed by global TourContext

  // Since we redirect immediately after tour start, no need to show loading screen
  if (!showParticipantForm) {
    return null;
  }
  


  // Guided tour is now handled globally by TourContext

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Demo Tour Registration
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Experience the future of manufacturing production scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.smith@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Manufacturing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Job Title (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Production Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="primaryRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      What role best describes you?
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your primary role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => {
                            const IconComponent = role.icon;
                            return (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-3">
                                  <IconComponent className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{role.name}</div>
                                    <div className="text-sm text-gray-500">{role.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Voice Narration Preference */}
              <FormField
                control={form.control}
                name="voiceNarrationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Volume2 className="h-4 w-4 text-blue-600" />
                        Enable voice narration during tour
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Get spoken guidance along with visual instructions for a more engaging experience
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Optional Fields */}
              <FormField
                control={form.control}
                name="referralSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did you hear about us? (Optional)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="search-engine">Search Engine</SelectItem>
                          <SelectItem value="social-media">Social Media</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="trade-show">Trade Show</SelectItem>
                          <SelectItem value="advertisement">Advertisement</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temporary Test Button - FOR DEVELOPMENT ONLY */}
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="w-full mb-4 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  form.setValue("firstName", "John");
                  form.setValue("lastName", "Smith");
                  form.setValue("email", "john.smith@acme-manufacturing.com");
                  form.setValue("company", "Acme Manufacturing");
                  form.setValue("jobTitle", "Production Manager");
                  form.setValue("primaryRole", "director");
                  form.setValue("referralSource", "search-engine");
                }}
              >
                🧪 TEMP: Fill Test Data (Remove Later)
              </Button>

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={createParticipantMutation.isPending}
              >
                {createParticipantMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Starting Demo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start My Demo Tour
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {/* Privacy Notice */}
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span>Your information is secure and will only be used for demo purposes</span>
                </div>
                <p>
                  By starting the demo, you agree to receive follow-up communications about PlanetTogether.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}