import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Settings,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Play,
  Move,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Kanban,
  Timer,
  TimerOff,
  Star
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  page: string;
  icon: React.ElementType;
  benefits: string[];
  actionText: string;
  duration: string;
  voiceScript?: string;
  // Enhanced navigation controls
  target?: {
    type: 'page' | 'tab' | 'section' | 'element' | 'button' | 'dialog';
    selector?: string; // CSS selector or data attribute
    tabId?: string; // For tab navigation (e.g., "tour-management", "role-demonstrations")
    action?: 'click' | 'hover' | 'focus' | 'scroll' | 'highlight';
    waitFor?: string; // Element to wait for after navigation
    description?: string; // Description of what to show/highlight
  };
  // Pre-actions to set up the step (optional)
  preActions?: Array<{
    type: 'click' | 'navigate' | 'scroll' | 'wait';
    selector?: string;
    value?: string | number;
    description?: string;
  }>;
  // Visual highlighting and focus
  spotlight?: {
    enabled: boolean;
    selector?: string; // What to highlight
    overlay?: boolean; // Show dark overlay on rest of screen
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
}

interface RoleData {
  id: number;
  name: string;
  description: string;
}

interface GuidedTourProps {
  roleId: number;
  initialStep?: number;
  initialVoiceEnabled?: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onSwitchRole?: (newRoleId: number) => void;
}

// Available roles for tour selection
const getAvailableRoles = () => [
  {
    id: "director",
    name: "Director",
    description: "Strategic oversight, business goals, and executive reporting",
    icon: TrendingUp
  },
  {
    id: "production-scheduler",
    name: "Production Scheduler",
    description: "Resource planning, job scheduling, and capacity optimization", 
    icon: BarChart3
  },
  {
    id: "plant-manager",
    name: "Plant Manager",
    description: "Overall operations management and department coordination",
    icon: Users
  },
  {
    id: "systems-manager",
    name: "Systems Manager", 
    description: "Technical administration, user management, and system configuration",
    icon: Settings
  }
];

// Helper function to get role icon based on role name
const getRoleIcon = (roleName: string): React.ElementType => {
  const roleIconMapping: Record<string, React.ElementType> = {
    "Director": TrendingUp,
    "Production Scheduler": BarChart3,
    "Plant Manager": Users,
    "Systems Manager": Settings,
    "Administrator": Settings,
    "IT Administrator": Settings,
    "IT Systems Administrator": Settings,
    "Maintenance Technician": Settings,
    "Data Analyst": BarChart3,
    "Trainer": Users,
    "Shop Floor Operations": Settings
  };
  
  return roleIconMapping[roleName] || Settings;
};

// Helper function to convert role display name to role key for mapping
const getRoleKey = (roleName: string): string => {
  const roleKeyMapping: Record<string, string> = {
    "Director": "director",
    "Production Scheduler": "production-scheduler", 
    "Plant Manager": "plant-manager",
    "Systems Manager": "systems-manager",
    "Administrator": "administrator",
    "IT Administrator": "it-administrator",
    "IT Systems Administrator": "it-administrator",
    "Maintenance Technician": "maintenance-technician",
    "Data Analyst": "data-analyst",
    "Trainer": "trainer",
    "Shop Floor Operations": "shop-floor-operations"
  };
  
  return roleKeyMapping[roleName] || roleName.toLowerCase().replace(/\s+/g, '-');
};

// Define role-specific tour steps - now fetched from database via roleId
const getTourSteps = (roleId: number): TourStep[] => {
  const commonSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Demo",
      description: "Let's explore the key features that will transform your manufacturing operations.",
      page: "current",
      icon: Play,
      benefits: [
        "See real-time production insights",
        "Experience intelligent scheduling",
        "Understand role-based workflows"
      ],
      actionText: "Start Tour",
      duration: "2 min tour"
    },
    {
      id: "demo-complete",
      title: "Demo Experience Complete",
      description: "You now have access to explore all PlanetTogether features using the sidebar navigation.",
      page: "current",
      icon: CheckCircle,
      benefits: [
        "Use the sidebar to navigate between features",
        "All demo data is available for exploration",
        "Contact us to learn about implementation"
      ],
      actionText: "Finish Tour",
      duration: "Complete"
    }
  ];

  const roleSteps: Record<string, TourStep[]> = {
    'director': [
      {
        id: "business-goals",
        title: "Strategic Business Goals",
        description: "Define and track strategic objectives with KPI monitoring and risk management.",
        page: "/business-goals",
        icon: TrendingUp,
        benefits: [
          "Align production with business objectives",
          "Monitor KPIs in real-time",
          "Identify and mitigate risks early"
        ],
        actionText: "Explore Goals",
        duration: "2 min"
      },
      {
        id: "analytics",
        title: "Executive Analytics",
        description: "Access comprehensive dashboards with production metrics and performance insights.",
        page: "/analytics",
        icon: BarChart3,
        benefits: [
          "Make data-driven decisions",
          "Identify optimization opportunities",
          "Track performance trends"
        ],
        actionText: "View Analytics",
        duration: "2 min"
      },
      {
        id: "reports",
        title: "Executive Reports",
        description: "Generate detailed reports for stakeholders and board presentations.",
        page: "/reports",
        icon: Settings,
        benefits: [
          "Professional reporting for stakeholders",
          "Automated report generation",
          "Custom metrics and visualizations"
        ],
        actionText: "See Reports",
        duration: "1 min"
      }
    ],
    'production-scheduler': [
      {
        id: "schedule",
        title: "Production Schedule",
        description: "Interactive Gantt charts for visual production planning and resource allocation.",
        page: "/",
        icon: BarChart3,
        benefits: [
          "Drag-and-drop operation scheduling",
          "Real-time capacity visualization",
          "Optimize resource utilization"
        ],
        actionText: "See Schedule",
        duration: "3 min"
      },
      {
        id: "boards",
        title: "Production Boards",
        description: "Organize jobs, operations, and resources using customizable board views.",
        page: "/boards",
        icon: Kanban,
        benefits: [
          "Kanban-style job management",
          "Visual workflow organization",
          "Customizable board layouts"
        ],
        actionText: "View Boards",
        duration: "2 min"
      },
      {
        id: "scheduling-optimizer",
        title: "Scheduling Optimizer",
        description: "AI-powered optimization for multi-operation order planning and resource allocation.",
        page: "/optimize-orders",
        icon: Target,
        benefits: [
          "Intelligent scheduling recommendations",
          "Optimize delivery timelines",
          "Balance efficiency and customer satisfaction"
        ],
        actionText: "Optimize Orders",
        duration: "2 min"
      }
    ],
    'plant-manager': [
      {
        id: "plant-overview",
        title: "Plant Management",
        description: "Comprehensive oversight of plant operations and strategic decision-making.",
        page: "/plant-manager",
        icon: Users,
        benefits: [
          "Complete plant visibility",
          "Strategic planning tools",
          "Performance optimization"
        ],
        actionText: "Manage Plant",
        duration: "3 min"
      },
      {
        id: "capacity-planning",
        title: "Capacity Planning",
        description: "Plan and optimize production capacity including staffing and equipment.",
        page: "/capacity-planning",
        icon: Target,
        benefits: [
          "Optimize resource allocation",
          "Plan future capacity needs",
          "Balance workloads effectively"
        ],
        actionText: "Plan Capacity",
        duration: "2 min"
      },
      {
        id: "schedule",
        title: "Production Schedule",
        description: "Monitor and oversee production scheduling from a management perspective.",
        page: "/",
        icon: BarChart3,
        benefits: [
          "Track production progress",
          "Monitor resource utilization",
          "Identify operational bottlenecks"
        ],
        actionText: "View Schedule",
        duration: "2 min"
      }
    ],
    'systems-manager': [
      {
        id: "systems-management",
        title: "Systems Management",
        description: "Configure system settings, manage integrations, and oversee technical operations.",
        page: "/systems-management",
        icon: Settings,
        benefits: [
          "System configuration and monitoring",
          "Integration management",
          "Technical oversight"
        ],
        actionText: "Manage Systems",
        duration: "3 min"
      },
      {
        id: "user-management",
        title: "User & Role Management",
        description: "Manage user accounts, role assignments, and access permissions.",
        page: "/user-role-assignments",
        icon: Users,
        benefits: [
          "Control user access",
          "Manage role permissions",
          "Ensure security compliance"
        ],
        actionText: "Manage Users",
        duration: "2 min"
      }
    ]
  };

  // Map roleId to role key for fallback steps
  const roleIdToKey: Record<number, string> = {
    1: 'director',
    3: 'production-scheduler', 
    4: 'plant-manager',
    5: 'systems-manager'
  };

  // Return role-specific steps plus common steps
  const roleKey = roleIdToKey[roleId];
  const roleSpecificSteps = roleKey ? roleSteps[roleKey] || [] : [];
  return [commonSteps[0], ...roleSpecificSteps, commonSteps[1]];
};

export function GuidedTour({ roleId, initialStep = 0, initialVoiceEnabled = false, onComplete, onSkip, onSwitchRole }: GuidedTourProps) {
  console.log("GuidedTour component mounted with roleId:", roleId, "initialVoiceEnabled:", initialVoiceEnabled);
  
  // Fetch role data to get role name for compatibility
  const { data: roleData } = useQuery<RoleData>({
    queryKey: [`/api/roles/${roleId}`],
    enabled: !!roleId,
  });
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Create session key for tour tracking
  const tourSessionKey = `tour-${roleId}-welcome-auto-played`;
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  // Reset to first step when role changes and clear auto-start tracking
  useEffect(() => {
    setCurrentStep(0);
    setHasAutoStarted(false); // Allow auto-start for new role
    // Clear previous tour auto-start tracking to allow fresh start
    sessionStorage.removeItem(tourSessionKey);
  }, [roleId, tourSessionKey]);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [voiceEnabled, setVoiceEnabled] = useState(initialVoiceEnabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [audioCompleted, setAudioCompleted] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  // Auto-advance state
  const [autoAdvance, setAutoAdvance] = useState(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<HTMLAudioElement | SpeechSynthesisUtterance | null>(null);

  // Fetch tours from database (all tours for fallback)
  const { data: toursFromAPI = [], isLoading: toursLoading } = useQuery<any[]>({
    queryKey: ["/api/tours"],
  });

  // Fetch specific tour by role ID for better performance
  const { data: specificTourData, isLoading: specificTourLoading } = useQuery<any>({
    queryKey: [`/api/tours/role-id/${roleId}`],
    enabled: !!roleId,
    retry: false, // Don't retry if tour doesn't exist
  });

  // Convert database tour data to TourStep format
  const getTourStepsFromDatabase = (roleId: number): TourStep[] => {
    // Use specific tour data if available, otherwise fall back to searching all tours
    const tourData = specificTourData || toursFromAPI.find((tour: any) => tour.roleId === roleId);
    
    const commonSteps: TourStep[] = [
      {
        id: "welcome",
        title: "Welcome to Your Demo",
        description: "Let's explore the key features that will transform your manufacturing operations.",
        page: "current",
        icon: Play,
        benefits: [
          "See real-time production insights",
          "Experience intelligent scheduling",
          "Understand role-based workflows"
        ],
        actionText: "Start Tour",
        duration: "2 min tour"
      },
      {
        id: "demo-complete",
        title: "Demo Experience Complete",
        description: "You now have access to explore all PlanetTogether features using the sidebar navigation.",
        page: "current",
        icon: CheckCircle,
        benefits: [
          "Use the sidebar to navigate between features",
          "All demo data is available for exploration",
          "Contact us to learn about implementation"
        ],
        actionText: "Finish Tour",
        duration: "Complete"
      }
    ];

    if (!tourData?.tourData?.steps) {
      // Fallback to original hardcoded steps if no database data  
      return getTourSteps(roleId);
    }

    // Convert database steps to TourStep format
    const databaseSteps: TourStep[] = tourData.tourData.steps.map((step: any) => ({
      id: (step.stepName || step.stepTitle)?.toLowerCase().replace(/\s+/g, '-') || step.id || 'step',
      title: step.stepName || step.stepTitle || step.title || 'Tour Step',
      description: step.description || step.voiceScript || 'Explore this feature',
      page: translateNavPath(step.navigationPath || step.page) || "current",
      icon: getIconForPage(translateNavPath(step.navigationPath || step.page)),
      benefits: Array.isArray(step.benefits) ? step.benefits : [step.benefits || "Learn about this feature"],
      actionText: step.stepName || step.stepTitle || "Continue",
      duration: "2 min"
    }));

    return [commonSteps[0], ...databaseSteps, commonSteps[1]];
  };

  // Helper function to translate descriptive navigation paths to actual URL routes
  const translateNavPath = (navPath: string): string => {
    if (!navPath || navPath === "current") return "current";
    
    // Handle descriptive navigation paths from database
    const routeMapping: Record<string, string> = {
      "Dashboard > Scheduling > Gantt Chart": "/production-schedule",
      "Dashboard > Scheduling > Boards": "/boards",
      "Dashboard > Scheduling > Optimization": "/optimize-orders",
      "Dashboard": "/production-schedule",
      "Boards": "/boards",
      "Scheduling": "/production-schedule",
      "Schedule": "/production-schedule",
      "Production Schedule": "/production-schedule",
      "Gantt Chart": "/production-schedule",
      "Optimization": "/optimize-orders",
      "Analytics": "/analytics",
      "Reports": "/reports",
      "Business Goals": "/business-goals",
      "Capacity Planning": "/capacity-planning",
      "Shop Floor": "/shop-floor",
      "Plant Manager": "/plant-manager-dashboard",
      "Systems Management": "/systems-management-dashboard",
      "Role Management": "/role-management",
      "Training": "/training",
      "Scheduling Optimizer": "/optimize-orders",
      "Visual Factory": "/visual-factory",
      "ERP Import": "/erp-import",
      "AI Assistant": "/max-ai-assistant",
      "Max AI": "/max-ai-assistant",
      "Operator": "/operator-dashboard",
      "Operator Dashboard": "/operator-dashboard",
      "Forklift Driver": "/forklift-driver"
    };
    
    // Check if it's already a valid URL path
    if (navPath.startsWith('/')) {
      return navPath;
    }
    
    // Look up the mapping
    return routeMapping[navPath] || "current";
  };

  // Helper function to get appropriate icon for each page
  const getIconForPage = (page: string): React.ElementType => {
    const pageIcons: Record<string, React.ElementType> = {
      '/business-goals': TrendingUp,
      '/analytics': BarChart3,
      '/reports': Settings,
      '/production-schedule': BarChart3,
      '/boards': Kanban,
      '/optimize-orders': Target,
      '/plant-manager-dashboard': Users,
      '/capacity-planning': BarChart3,
      '/shop-floor': Settings,
      '/systems-management-dashboard': Settings,
      '/role-management': Users,
      '/user-role-assignments-page': Users,
      '/training': Lightbulb,
      '/max-ai-assistant': Settings,
      '/operator-dashboard': Settings,
      '/forklift-driver': Settings,
    };
    return pageIcons[page] || Settings;
  };

  // Calculate tour steps safely after data is loaded
  const tourSteps = (toursLoading || specificTourLoading) ? [] : getTourStepsFromDatabase(roleId);
  const progress = tourSteps.length > 0 ? ((currentStep + 1) / tourSteps.length) * 100 : 0;
  
  console.log("GuidedTour initialized - tourSteps:", tourSteps, "currentStep:", currentStep, "loading:", toursLoading);

  // Use a unique tour session key to track auto-start behavior
  // (Already defined above, so we'll use the one from line 376)
  
  // Auto-start voice narration for welcome step if voice is enabled (only once per tour session)
  useEffect(() => {
    console.log("Auto-start voice effect triggered:", { initialVoiceEnabled, currentStep, hasSteps: tourSteps.length > 0, hasAutoStarted });
    if (initialVoiceEnabled && currentStep === 0 && tourSteps.length > 0 && !hasAutoStarted) {
      // Check if we've already auto-played the welcome step for this tour session
      const welcomeAlreadyPlayed = sessionStorage.getItem(tourSessionKey) === 'true';
      
      if (!welcomeAlreadyPlayed) {
        // Small delay to ensure component is ready
        const timer = setTimeout(() => {
          console.log("Auto-starting voice for welcome step since user enabled voice narration");
          setHasAutoStarted(true);
          sessionStorage.setItem(tourSessionKey, 'true');
          playPreloadedAudio(tourSteps[0].id);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [initialVoiceEnabled, tourSteps, currentStep, hasAutoStarted, tourSessionKey]);
  
  // Play cached audio directly from server for a specific step  
  const playPreloadedAudio = async (stepId: string) => {
    if (!voiceEnabled || isLoadingVoice || isPlaying) {
      console.log("Audio already loading or playing, skipping:", { voiceEnabled, isLoadingVoice, isPlaying });
      return;
    }

    // Double-check and stop any currently playing audio first
    if (speechRef.current) {
      console.log("Stopping existing audio before starting new playback");
    }
    stopSpeech();
    
    // Always use server-side cached audio for instant playback
    const currentStepData = tourSteps.find(step => step.id === stepId);
    if (currentStepData) {
      const enhancedText = createEngagingNarration(currentStepData, (roleData as any)?.name || 'unknown');
      console.log(`Playing cached audio for step: ${stepId}`);
      
      try {
        // Show loading indicator while generating/loading voice
        setIsLoadingVoice(true);
        setIsPlaying(false);
        
        const response = await fetch("/api/ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            text: enhancedText,
            gender: "female",
            voice: "alloy",
            speed: 1.15,
            role: roleData?.name || 'unknown',
            stepId: stepId
          })
        });

        if (!response.ok) {
          throw new Error(`No cached audio available: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.preload = "auto";
        
        audio.onended = () => {
          setIsPlaying(false);
          setIsLoadingVoice(false);
          setAudioCompleted(true);
          URL.revokeObjectURL(audioUrl);
          speechRef.current = null;
          console.log("Cached audio playback completed - user can click Next");
          
          // Audio completed - no action needed
          
          // Auto-advance to next step if enabled and not on last step
          if (autoAdvance && currentStep < tourSteps.length - 1) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              handleNext();
            }, 2000); // Wait 2 seconds after audio ends before advancing
          } else if (autoAdvance && currentStep === tourSteps.length - 1) {
            // Auto-complete tour if on last step
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              handleComplete();
            }, 2000); // Wait 2 seconds after audio ends before showing completion dialog
          }
        };
        
        audio.onerror = (e) => {
          console.error("Cached audio playback error:", e);
          setIsPlaying(false);
          setIsLoadingVoice(false);
          URL.revokeObjectURL(audioUrl);
          speechRef.current = null;
        };
        
        speechRef.current = audio;
        
        try {
          await audio.play();
          setIsLoadingVoice(false);
          setIsPlaying(true);
          console.log("Cached audio started playing");
        } catch (playError) {
          console.error("Auto-play failed:", playError);
          setIsPlaying(false);
          setIsLoadingVoice(false);
        }
        
      } catch (error) {
        console.error(`Failed to load cached audio for step ${stepId}:`, error);
        setIsPlaying(false);
        setIsLoadingVoice(false);
      }
    }
  };

  // Separate function for voice toggle that bypasses voice enabled check
  const playPreloadedAudioForToggle = async (stepId: string) => {
    if (isPlaying || isLoadingVoice) return;
    
    // Stop any currently playing audio first
    stopSpeech();
    
    // Always use server-side cached audio for instant playback
    const currentStepData = tourSteps.find(step => step.id === stepId);
    if (currentStepData) {
      const enhancedText = createEngagingNarration(currentStepData, roleData?.name || 'unknown');
      console.log(`Playing cached audio for voice toggle on step: ${stepId}`);
      
      try {
        // Show loading indicator while generating/loading voice
        setIsLoadingVoice(true);
        setIsPlaying(false);
        
        const response = await fetch("/api/ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            text: enhancedText,
            gender: "female",
            voice: "alloy",
            speed: 1.15,
            role: roleData?.name || 'unknown',
            stepId: stepId
          })
        });

        if (!response.ok) {
          throw new Error(`No cached audio available: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.preload = "auto";
        
        audio.onended = () => {
          setIsPlaying(false);
          setIsLoadingVoice(false);
          URL.revokeObjectURL(audioUrl);
          speechRef.current = null;
          console.log("Voice toggle audio playback completed");
        };
        
        audio.onerror = (e) => {
          console.error("Voice toggle audio playback error:", e);
          setIsPlaying(false);
          setIsLoadingVoice(false);
          URL.revokeObjectURL(audioUrl);
          speechRef.current = null;
        };
        
        speechRef.current = audio;
        
        try {
          await audio.play();
          setIsLoadingVoice(false);
          setIsPlaying(true);
          console.log("Voice toggle audio started playing");
        } catch (playError) {
          console.error("Voice toggle auto-play failed:", playError);
          setIsPlaying(false);
          setIsLoadingVoice(false);
        }
        
      } catch (error) {
        console.error(`Failed to load cached audio for voice toggle on step ${stepId}:`, error);
        setIsPlaying(false);
        setIsLoadingVoice(false);
      }
    }
  };

  // Track window size for responsive design
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Set initial position to lower right corner with boundary checking
  useEffect(() => {
    const isMobile = windowSize.width < 768; // md breakpoint
    const cardWidth = isMobile ? Math.min(320, windowSize.width - 40) : 384; // Responsive width
    const maxCardHeight = isMobile ? 
      Math.min(400, windowSize.height * 0.6) : // Mobile: 60% of screen height, max 400px
      Math.min(600, windowSize.height - 100); // Desktop: original behavior
    const padding = isMobile ? 10 : 20; // Less padding on mobile
    
    // Always position in bottom right corner for both mobile and desktop
    setPosition({
      x: Math.max(padding, windowSize.width - cardWidth - padding),
      y: Math.max(padding, windowSize.height - maxCardHeight - padding)
    });
  }, [windowSize]);

  // Handle window resize to keep tour window in bounds
  useEffect(() => {
    const handleResize = () => {
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      setWindowSize(newSize);
      
      // Constrain current position to new window bounds
      const constrainedPosition = constrainToViewport(position);
      if (constrainedPosition.x !== position.x || constrainedPosition.y !== position.y) {
        setPosition(constrainedPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Boundary checking function to keep window in viewport
  const constrainToViewport = (newPosition: { x: number; y: number }) => {
    const isMobile = windowSize.width < 768;
    const cardWidth = isMobile ? Math.min(280, windowSize.width - 20) : 384;
    const maxCardHeight = isMobile ? 
      Math.min(200, windowSize.height * 0.35) : 
      Math.min(600, windowSize.height - 100);
    const padding = isMobile ? 10 : 20;
    
    return {
      x: Math.max(padding, Math.min(newPosition.x, windowSize.width - cardWidth - padding)),
      y: Math.max(padding, Math.min(newPosition.y, windowSize.height - maxCardHeight - padding))
    };
  };

  // Remove duplicate auto-start effect - handled by the one above

  // Play cached audio when step changes and voice is enabled
  useEffect(() => {
    if (voiceEnabled && tourSteps[currentStep] && currentStep > 0) {
      const currentStepData = tourSteps[currentStep];
      
      console.log("Step change detected, stopping any existing audio");
      // Stop any existing audio before starting new audio
      stopSpeech();
      
      // Use server-side cached audio for instant playback with longer delay to ensure cleanup
      // Increased timeout to ensure proper audio cleanup
      const audioTimeout = setTimeout(() => {
        console.log("Starting new audio for step:", currentStepData.id);
        playPreloadedAudio(currentStepData.id);
      }, 250); // Extended delay for better audio state cleanup
      
      // Cleanup timeout if component unmounts or step changes again quickly
      return () => {
        clearTimeout(audioTimeout);
      };
    }
  }, [currentStep, voiceEnabled]);

  // Clean up speech and timeouts on component unmount, and listen for logout tour close events
  useEffect(() => {
    const handleTourClose = () => {
      console.log("Tour close event received from logout - closing tour window");
      onSkip(); // Close the tour window
    };

    // Listen for tour close events from logout
    window.addEventListener('tourClose', handleTourClose);

    return () => {
      stopSpeech(); // Use our comprehensive stop function instead of just speechSynthesis.cancel()
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      window.removeEventListener('tourClose', handleTourClose);
    };
  }, [onSkip]);

  // Drag functionality with boundary checking (mouse and touch support)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = constrainToViewport({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
        setPosition(newPosition);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const newPosition = constrainToViewport({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
        setPosition(newPosition);
        e.preventDefault(); // Prevent scrolling during drag
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      e.preventDefault(); // Prevent default behavior
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (cardRef.current && e.touches.length === 1) {
      const rect = cardRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
      e.preventDefault(); // Prevent default touch behavior
    }
  };

  // Enhanced navigation function that handles target actions
  const executeStepNavigation = async (step: TourStep) => {
    try {
      console.log("Executing enhanced navigation for step:", step.title, step.target);
      
      // Execute pre-actions if defined
      if (step.preActions) {
        for (const preAction of step.preActions) {
          await executeAction(preAction);
        }
      }

      // Navigate to page if needed
      if (step.page && step.page !== "current") {
        console.log("Navigating to page:", step.page);
        setLocation(step.page);
        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Execute target action if defined
      if (step.target) {
        await executeTargetAction(step.target);
      }

      // Apply spotlight if defined
      if (step.spotlight?.enabled) {
        applySpotlight(step.spotlight);
      }

    } catch (error) {
      console.error("Error executing step navigation:", error);
    }
  };

  // Execute individual actions
  const executeAction = async (action: any): Promise<void> => {
    return new Promise((resolve) => {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            const element = document.querySelector(action.selector);
            if (element) {
              (element as HTMLElement).click();
              console.log(`Clicked element: ${action.selector}`);
            }
          }
          break;
        case 'scroll':
          if (action.selector) {
            const element = document.querySelector(action.selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              console.log(`Scrolled to element: ${action.selector}`);
            }
          }
          break;
        case 'wait':
          setTimeout(resolve, action.value as number || 1000);
          return;
      }
      setTimeout(resolve, 500); // Default wait time
    });
  };

  // Execute target actions with enhanced functionality
  const executeTargetAction = async (target: any): Promise<void> => {
    return new Promise((resolve) => {
      switch (target.type) {
        case 'tab':
          // Click on a tab to show it
          if (target.tabId || target.selector) {
            const tabSelector = target.selector || `[data-tab="${target.tabId}"]`;
            const tabElement = document.querySelector(tabSelector);
            if (tabElement) {
              (tabElement as HTMLElement).click();
              console.log(`Clicked tab: ${target.tabId || target.selector}`);
            } else {
              // Try alternative selectors for tabs
              const altSelectors = [
                `button[value="${target.tabId}"]`,
                `[role="tab"][data-value="${target.tabId}"]`,
                `[data-testid="${target.tabId}"]`,
                `.tabs [data-value="${target.tabId}"]`
              ];
              for (const selector of altSelectors) {
                const elem = document.querySelector(selector);
                if (elem) {
                  (elem as HTMLElement).click();
                  console.log(`Clicked tab via selector: ${selector}`);
                  break;
                }
              }
            }
          }
          break;
        case 'section':
          // Scroll to and highlight a section
          if (target.selector) {
            const element = document.querySelector(target.selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add visual highlight
              element.classList.add('tour-highlight');
              setTimeout(() => element.classList.remove('tour-highlight'), 3000);
              console.log(`Highlighted section: ${target.selector}`);
            }
          }
          break;
        case 'element':
        case 'button':
          // Highlight an element or button
          if (target.selector) {
            const element = document.querySelector(target.selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (target.action === 'click') {
                (element as HTMLElement).click();
                console.log(`Clicked element: ${target.selector}`);
              } else {
                // Just highlight
                element.classList.add('tour-highlight');
                setTimeout(() => element.classList.remove('tour-highlight'), 3000);
                console.log(`Highlighted element: ${target.selector}`);
              }
            }
          }
          break;
      }
      setTimeout(resolve, 1000); // Wait for action to complete
    });
  };

  // Apply visual spotlight effect
  const applySpotlight = (spotlight: any) => {
    if (spotlight.selector) {
      const element = document.querySelector(spotlight.selector);
      if (element) {
        // Create spotlight overlay
        const overlay = document.createElement('div');
        overlay.className = 'tour-spotlight-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          pointer-events: none;
          z-index: 9998;
        `;
        
        // Get element position
        const rect = element.getBoundingClientRect();
        const spotlight = document.createElement('div');
        spotlight.className = 'tour-spotlight';
        spotlight.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #3b82f6;
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
          pointer-events: none;
          z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(spotlight);
        
        // Remove spotlight after 5 seconds
        setTimeout(() => {
          if (document.body.contains(overlay)) document.body.removeChild(overlay);
          if (document.body.contains(spotlight)) document.body.removeChild(spotlight);
        }, 5000);
        
        console.log(`Applied spotlight to element`);
      }
    }
  };

  const handleNext = async () => {
    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    stopSpeech(); // Stop current speech before proceeding
    setAudioCompleted(false); // Reset audio completed state for next step
    
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      const nextStepData = tourSteps[nextStep];
      
      console.log("Moving to tour step:", nextStep, "page:", nextStepData.page);
      
      setCurrentStep(nextStep);
      
      // Execute enhanced navigation for the next step
      setTimeout(async () => {
        await executeStepNavigation(nextStepData);
      }, 100); // Small delay to ensure step is set
      
      // Voice will be handled automatically by useEffect when currentStep changes
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    console.log("handlePrevious called - stopping all audio");
    // Stop current speech before proceeding with extended delay
    stopSpeech(); 
    
    // Reset audio states
    setAudioCompleted(false); // Reset audio completed state for previous step
    setHasAutoStarted(false); // Allow auto-start for previous step
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    stopSpeech();
    // Instead of completing immediately, show role selection dialog
    setShowRoleSelection(true);
  };

  const handleContinueWithNewRole = (newRole: string) => {
    console.log("Starting new tour with role:", newRole);
    stopSpeech(); // Stop any playing audio before switching roles
    setShowRoleSelection(false);
    
    // Map role string to role ID
    const roleMapping: Record<string, number> = {
      "director": 1,
      "plant-manager": 2,
      "production-scheduler": 3,
      "it-administrator": 4,
      "systems-manager": 5,
      "administrator": 6,
      "maintenance-technician": 7,
      "data-analyst": 8,
      "trainer": 9,
      "shop-floor-operations": 10
    };
    
    const roleId = roleMapping[newRole];
    
    if (roleId && onSwitchRole) {
      onSwitchRole(roleId);
    } else {
      console.error("No role ID found for role:", newRole);
    }
  };

  const handleFinishAllTours = () => {
    stopSpeech(); // Stop any playing audio before finishing
    setShowRoleSelection(false);
    setIsVisible(false);
    toast({
      title: "All Tours Complete!",
      description: "Thanks for exploring PlanetTogether! Continue exploring the features on your own.",
    });
    onComplete();
  };

  const handleExitApplication = () => {
    stopSpeech(); // Stop any playing audio before exiting
    setShowRoleSelection(false);
    setIsVisible(false);
    toast({
      title: "Thanks for visiting!",
      description: "Closing PlanetTogether demo...",
    });
    
    // Exit the application by closing the window
    setTimeout(() => {
      window.close();
      
      // If window.close() doesn't work (security restrictions), redirect to about:blank
      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 1000);
    }, 1500);
  };

  const handleSkipTour = () => {
    stopSpeech();
    
    // Save tour progress to localStorage so user can resume later
    const tourState = {
      roleId,
      currentStep,
      voiceEnabled,
      timestamp: Date.now()
    };
    localStorage.setItem('tourProgress', JSON.stringify(tourState));
    
    setIsVisible(false);
    onSkip();
  };

  // Create engaging narration for each step
  const createEngagingNarration = (step: TourStep, userRole: string): string => {
    const engagingNarrations: { [key: string]: string } = {
      "welcome": "Welcome to your personalized PlanetTogether demo! I'm excited to show you how our intelligent manufacturing platform can revolutionize your production operations. In the next few minutes, you'll discover features specifically tailored for your role that will save time, reduce costs, and boost efficiency. Let's begin this journey together!",
      
      "business-goals": "Now we're entering the Strategic Business Goals module - this is where directors like yourself align manufacturing operations with strategic objectives. Here you can set KPIs, monitor progress in real-time, and identify risks before they impact your business. Think of this as your command center for ensuring production supports your broader business strategy. You can track metrics like on-time delivery, cost per unit, and quality scores.",
      
      "analytics": "Welcome to the Executive Analytics dashboard - your data-driven decision-making hub! This powerful interface transforms complex production data into actionable insights. You can spot trends, identify bottlenecks, and discover optimization opportunities at a glance. The customizable widgets adapt to show the metrics that matter most to directors - from overall equipment effectiveness to profit margins. Notice how everything updates in real-time to give you the current pulse of your operation.",
      
      "reports": "Here's the Executive Reports center where you can generate comprehensive reports for stakeholders and board presentations. These aren't just basic charts - they're intelligent reports that highlight key insights and recommendations. You can schedule automatic delivery to executives, customize layouts for different audiences, and drill down into specific metrics. Perfect for monthly reviews, quarterly business reports, and strategic planning sessions.",
      
      "schedule": "Now you're seeing the heart of PlanetTogether - our intelligent production scheduler! This interactive Gantt chart gives you complete visibility into your manufacturing operations. Watch how you can drag and drop operations between resources, see real-time capacity utilization, and instantly understand the impact of schedule changes. The system automatically checks resource capabilities and highlights potential conflicts. This is where efficiency gains happen!",
      
      "shop-floor": "This is our mobile-optimized Shop Floor interface - designed for managers who need to stay connected while walking the production floor. You can monitor operations in real-time, respond to issues instantly, and keep production moving smoothly. The interface adapts perfectly to tablets and smartphones, so you're never out of touch with what's happening on the floor.",
      
      "plant-overview": "Welcome to Plant Management central command! This comprehensive view gives plant managers complete oversight of all operations. You can monitor multiple production lines, track key performance indicators, and coordinate between departments seamlessly. The dashboard aggregates data from across your facility to provide the big picture while allowing you to drill down into specific areas when needed.",
      
      "capacity-planning": "Here's where strategic capacity planning comes alive! This module helps you balance current workloads while planning for future growth. You can model different scenarios, understand resource constraints, and make informed decisions about staffing and equipment needs. The system shows you exactly where bottlenecks might occur and suggests optimal resource allocation strategies.",
      
      "demo-complete": "Congratulations! You've experienced the core capabilities of PlanetTogether that are transforming manufacturing operations worldwide. Take your time exploring these features using the navigation menu - all the demo data is ready for you to experiment with. When you're ready to see how PlanetTogether can work with your specific operations, our team is here to help you get started. Thank you for taking this journey with us!"
    };

    return engagingNarrations[step.id] || `Let me show you ${step.title}. ${step.description} This feature will help you ${step.benefits[0]?.toLowerCase()}.`;
  };

  // Legacy speakText function - removed since we only use cached audio now

  // Fallback to browser speech if AI fails
  const fallbackSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    console.log("Using fallback browser speech synthesis");
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    
    // Try to find a good female voice for fallback
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('samantha')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    // Comprehensive audio cleanup
    if (speechRef.current) {
      if (speechRef.current instanceof Audio) {
        try {
          // Pause and reset audio
          speechRef.current.pause();
          speechRef.current.currentTime = 0;
          
          // Remove all event listeners by setting to null
          speechRef.current.onended = null;
          speechRef.current.onerror = null;
          speechRef.current.onloadstart = null;
          speechRef.current.oncanplay = null;
          
          // If there's a URL object, revoke it to free memory
          if (speechRef.current.src && speechRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(speechRef.current.src);
          }
        } catch (error) {
          console.warn("Error stopping audio:", error);
        }
      }
      speechRef.current = null;
    }
    
    // Also cancel browser speech synthesis as fallback
    if ('speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
      } catch (error) {
        console.warn("Error canceling speech synthesis:", error);
      }
    }
    
    // Reset all audio-related states
    setIsPlaying(false);
    setIsLoadingVoice(false);
  };

  const toggleVoice = () => {
    // Prevent toggling while audio is playing
    if (isPlaying) return;
    
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    
    if (!newVoiceEnabled) {
      stopSpeech();
    } else if (newVoiceEnabled && tourSteps[currentStep]) {
      // Immediately start playing when voice is enabled
      // Set voice as enabled first, then play audio
      setTimeout(() => {
        if (tourSteps[currentStep]) {
          playPreloadedAudioForToggle(tourSteps[currentStep].id);
        }
      }, 100); // Small delay to ensure state is updated
    }
  };

  const togglePlayPause = () => {
    // Prevent multiple clicks if voice is disabled
    if (!voiceEnabled) return;
    
    if (isPlaying) {
      stopSpeech();
    } else if (tourSteps[currentStep]) {
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };



  // Show loading state if tours are still being fetched
  if (toursLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-96 shadow-lg border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tour data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepData = tourSteps[currentStep];
  const StepIcon = currentStepData?.icon || Settings;

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Light backdrop that allows interaction with background */}
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40 pointer-events-none"></div>
      
      {/* Draggable tour window */}
      <Card 
        ref={cardRef}
        className="fixed bg-white shadow-2xl z-50 cursor-move flex flex-col md:w-96"
        style={{
          left: position.x,
          top: position.y,
          width: windowSize.width < 768 ? `${Math.min(280, windowSize.width - 20)}px` : '384px',
          height: windowSize.width < 768 ? 
            `${Math.min(200, windowSize.height * 0.35)}px` : 
            `${Math.min(600, windowSize.height - 100)}px`,
          maxHeight: windowSize.width < 768 ? '35vh' : '90vh'
        }}
      >
        <CardHeader 
          className="relative cursor-move flex-shrink-0 p-2 sm:p-6 pb-1 sm:pb-6"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4 text-gray-400" />
              <Badge variant="secondary" className="text-sm">
                {roleData?.name || 'Demo'} Demo
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {/* Voice Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className={`text-gray-500 hover:text-gray-700 ${voiceEnabled ? 'bg-blue-50 text-blue-600' : ''}`}
                title={voiceEnabled ? "Turn off voice narration" : "Turn on voice narration"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              {/* Voice Controls (only shown when voice is enabled) */}
              {voiceEnabled && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-gray-500 hover:text-gray-700"
                    title={isPlaying ? "Pause narration" : "Play narration"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {/* Replay Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("Replay button clicked for step:", tourSteps[currentStep]?.id);
                      stopSpeech();
                      // Small delay to ensure audio stops before starting new playback
                      setTimeout(() => {
                        playPreloadedAudio(tourSteps[currentStep]?.id);
                      }, 100);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    title="Replay current step narration"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTour}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
            
            <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100">
                <StepIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl text-gray-900 leading-tight">
                  {currentStepData.title}
                </CardTitle>
                {/* Hide description on mobile to save space */}
                <p className="text-gray-600 mt-1 text-sm sm:text-base line-clamp-2 hidden sm:block">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                <span>Step {currentStep + 1} of {tourSteps.length}</span>
                <span className="hidden sm:inline">{currentStepData.duration}</span>
              </div>
              <Progress value={progress} className="h-1 sm:h-2" />
            </div>
            
            {/* Voice Status Indicator - positioned as floating overlay on mobile */}
            {voiceEnabled && (isLoadingVoice || isPlaying) && (
              <div className="absolute top-20 right-2 sm:static sm:top-auto sm:right-auto text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 py-1 sm:px-3 sm:py-2 rounded-md shadow-sm sm:shadow-none z-10">
                <div className="flex items-center gap-2">
                  {isLoadingVoice ? (
                    <>
                      <div className="h-2 w-2 sm:h-3 sm:w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Loading voice narration...</span>
                      <span className="sm:hidden">Loading...</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 sm:h-3 sm:w-3 bg-blue-500 rounded-full animate-pulse" />
                      <span className="hidden sm:inline">Playing voice narration</span>
                      <span className="sm:hidden">Playing</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="pointer-events-auto flex-1 flex flex-col min-h-0 p-2 sm:p-6 pt-0 pb-1 sm:pb-6" onMouseDown={(e) => e.stopPropagation()}>
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 sm:space-y-4">
              {/* Benefits - hidden on mobile to save space */}
              <div className="hidden sm:block">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  Key Benefits
                </h4>
                <ul className="space-y-1">
                  {(Array.isArray(currentStepData.benefits) 
                    ? currentStepData.benefits.slice(0, 3) 
                    : [currentStepData.benefits].slice(0, 3)
                  ).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visit Page Button for steps with specific pages */}
              {currentStepData.page && currentStepData.page !== "current" && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      console.log("Visiting page:", currentStepData.page);
                      setLocation(currentStepData.page);
                    }}
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {currentStepData.actionText}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Fixed Action Buttons at bottom */}
            <div className="flex items-center justify-between pt-1 sm:pt-3 border-t bg-white flex-shrink-0">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipTour}
                  className="text-gray-500 px-1 sm:px-2 text-xs sm:text-sm h-6 sm:h-8"
                >
                  Skip
                </Button>
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious} className="px-1 sm:px-2 text-xs sm:text-sm h-6 sm:h-8">
                    <ChevronLeft className="h-3 w-3 mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                )}

              </div>
              
              <div className="flex gap-1">
                {/* Auto-advance toggle button */}
                <Button
                  variant={autoAdvance ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newAutoAdvance = !autoAdvance;
                    setAutoAdvance(newAutoAdvance);
                    
                    // If turning on auto-advance and audio has completed, immediately advance
                    if (newAutoAdvance && audioCompleted && currentStep < tourSteps.length - 1) {
                      autoAdvanceTimeoutRef.current = setTimeout(() => {
                        handleNext();
                      }, 100); // Very quick advance when toggling on
                    } else if (newAutoAdvance && audioCompleted && currentStep === tourSteps.length - 1) {
                      // Auto-complete tour if on last step
                      autoAdvanceTimeoutRef.current = setTimeout(() => {
                        handleComplete();
                      }, 100); // Very quick completion when toggling on
                    }
                  }}
                  className={`px-1 sm:px-2 text-xs sm:text-sm h-6 sm:h-8 ${autoAdvance ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  title={autoAdvance ? "Turn off auto-advance" : "Turn on auto-advance"}
                >
                  {autoAdvance ? <Timer className="h-3 w-3 mr-0 sm:mr-1" /> : <TimerOff className="h-3 w-3 mr-0 sm:mr-1" />}
                  <span className="hidden sm:inline">{autoAdvance ? "Auto" : "Manual"}</span>
                </Button>
                
                <Button 
                  onClick={handleNext} 
                  size="sm" 
                  className={`bg-blue-600 hover:bg-blue-700 px-2 sm:px-3 text-xs sm:text-sm h-6 sm:h-8 transition-all duration-300 ${
                    audioCompleted && voiceEnabled && !autoAdvance ? 'animate-pulse shadow-lg ring-2 ring-blue-300' : ''
                  }`}
                >
                  {currentStep === tourSteps.length - 1 ? (
                    <>
                      <span className="hidden sm:inline">Complete</span>
                      <span className="sm:hidden">Done</span>
                      <CheckCircle className="h-3 w-3 ml-0 sm:ml-1" />
                    </>
                  ) : (
                    <>
                      {audioCompleted && voiceEnabled && !autoAdvance ? <span className="hidden sm:inline">👉 </span> : ''}<span className="hidden sm:inline">Next</span><span className="sm:hidden">→</span>
                      <ArrowRight className="h-3 w-3 ml-0 sm:ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Selection Dialog - Mobile Optimized */}
        <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
          <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-center mb-4">
                🎉 Tour Complete! Continue Exploring?
              </DialogTitle>
            </DialogHeader>
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Great job completing the <strong>{roleData?.name || 'Demo'}</strong> tour! 
                  Would you like to explore PlanetTogether from another role's perspective?
                </p>
                <p className="text-sm text-gray-500 mb-4 sm:mb-6">
                  Each role shows different features and capabilities tailored to specific responsibilities.
                </p>
              </div>

              {/* Available Tours Grid - Show All Tours from Database */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {toursFromAPI
                  .filter((tour: any) => tour.roleId !== roleId) // Exclude current role
                  .map((tour: any) => {
                    const tourRole = tour.roleDisplayName || tour.roleName || `Role ${tour.roleId}`;
                    const tourDescription = tour.tourData?.description || tour.description || "Explore features and capabilities for this role";
                    const roleIcon = getRoleIcon(tourRole);
                    
                    return (
                      <Button
                        key={tour.id}
                        onClick={() => handleContinueWithNewRole(getRoleKey(tourRole))}
                        variant="outline"
                        className="h-auto p-3 sm:p-4 text-left hover:bg-blue-50 hover:border-blue-300 min-h-[70px] sm:min-h-[80px] flex items-start"
                      >
                        <div className="flex items-start gap-2 sm:gap-3 w-full">
                          {React.createElement(roleIcon, { className: "h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" })}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{tourRole}</div>
                            <div className="text-xs text-gray-500 leading-relaxed overflow-hidden">
                              {tourDescription.length > 50 
                                ? `${tourDescription.substring(0, 50)}...` 
                                : tourDescription
                              }
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                
                {/* Fallback to hardcoded roles if no tours from database */}
                {toursFromAPI.length === 0 && getAvailableRoles()
                  .filter(availableRole => parseInt(availableRole.id) !== roleId)
                  .map((availableRole) => (
                    <Button
                      key={availableRole.id}
                      onClick={() => handleContinueWithNewRole(availableRole.id)}
                      variant="outline"
                      className="h-auto p-3 sm:p-4 text-left hover:bg-blue-50 hover:border-blue-300 min-h-[70px] sm:min-h-[80px] flex items-start"
                    >
                      <div className="flex items-start gap-2 sm:gap-3 w-full">
                        <availableRole.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{availableRole.name}</div>
                          <div className="text-xs text-gray-500 leading-relaxed overflow-hidden">
                            {availableRole.description.length > 50 
                              ? `${availableRole.description.substring(0, 50)}...` 
                              : availableRole.description
                            }
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>

            </div>

            {/* Fixed Action Buttons at bottom */}
            <div className="flex-shrink-0 space-y-3 pt-4 border-t bg-white">
              {/* Primary CTA for prospects */}
              <Button 
                onClick={() => {
                  setShowRoleSelection(false);
                  window.location.href = '/pricing';
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base py-2 sm:py-3"
              >
                <Star className="h-4 w-4 mr-2" />
                View Pricing & Plans
              </Button>
              
              {/* Secondary actions */}
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  onClick={handleExitApplication}
                  variant="outline" 
                  className="flex-1 text-sm sm:text-base py-2 sm:py-3"
                >
                  Exit Demo
                </Button>
                <Button 
                  onClick={handleFinishAllTours}
                  variant="outline"
                  className="flex-1 text-sm sm:text-base py-2 sm:py-3"
                >
                  Explore More
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </>
  );
}