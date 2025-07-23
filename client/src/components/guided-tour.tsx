import React, { useState, useRef, useEffect, useCallback } from "react";
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
  navigationPath?: string;
  targetPage?: string;
  route?: string;
  icon: React.ElementType;
  benefits: string[];
  actionText: string;
  duration: string;
  voiceScript?: string;
  target?: {
    type: 'page' | 'tab' | 'section' | 'element' | 'button' | 'dialog';
    selector?: string;
    tabId?: string;
    action?: 'click' | 'hover' | 'focus' | 'scroll' | 'highlight';
    waitFor?: string;
    description?: string;
  };
  preActions?: Array<{
    type: 'click' | 'navigate' | 'scroll' | 'wait';
    selector?: string;
    value?: string | number;
    description?: string;
  }>;
  spotlight?: {
    enabled: boolean;
    selector?: string;
    overlay?: boolean;
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

// Helper function to get role icon
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

// Helper function to create engaging narration
const createEngagingNarration = (step: TourStep, roleName: string): string => {
  const introTexts = [
    `Welcome to ${step.title}`,
    `Let's explore ${step.title}`,
    `Now we'll look at ${step.title}`
  ];
  
  const intro = introTexts[Math.floor(Math.random() * introTexts.length)];
  const benefits = step.benefits.length > 0 ? ` Key benefits include: ${step.benefits.join(', ')}.` : '';
  
  return `${intro}. ${step.description}${benefits} This takes approximately ${step.duration}.`;
};

// Get tour steps from database based on role
const getTourStepsFromDatabase = (roleId: number, toursFromAPI: any[]): TourStep[] => {
  console.log("Getting tour steps for roleId:", roleId, "available tours:", toursFromAPI.map(t => ({
    id: t.id, 
    roleId: t.roleId, 
    roleDisplayName: t.roleDisplayName, 
    tourDataStepsCount: t.tourData?.steps?.length || 0,
    tourDataKeys: Object.keys(t.tourData || {}),
    hasStepsField: !!t.tourData?.steps
  })));
  
  // First try to find exact role match
  let roleSpecificTour = toursFromAPI.find(tour => tour.roleId === roleId);
  
  // If no exact match, try to find by role name mapping
  if (!roleSpecificTour) {
    // Map common role names to find tours
    const roleNameMappings: Record<number, string[]> = {
      14: ["Support Engineer", "Systems Manager", "Administrator"], // Role 14 might need different mapping
      1: ["Director"],
      3: ["Production Scheduler"],
      4: ["Plant Manager"],
      5: ["Systems Manager"]
    };
    
    const possibleNames = roleNameMappings[roleId] || [];
    roleSpecificTour = toursFromAPI.find(tour => 
      possibleNames.some(name => 
        tour.roleDisplayName?.toLowerCase().includes(name.toLowerCase()) ||
        tour.roleName?.toLowerCase().includes(name.toLowerCase())
      )
    );
  }
  
  // If still no match, use the first available tour as fallback
  if (!roleSpecificTour && toursFromAPI.length > 0) {
    console.log("No role-specific tour found, using first available tour");
    roleSpecificTour = toursFromAPI[0];
  }
  
  // Check if tour has steps in tourData
  const tourSteps = roleSpecificTour?.tourData?.steps || [];
  
  if (roleSpecificTour && tourSteps.length > 0) {
    console.log("Found tour with", tourSteps.length, "steps for role:", roleSpecificTour.roleDisplayName);
    console.log("Sample step structure:", tourSteps[0]);
    
    // Convert database tour steps to TourStep format
    return tourSteps.map((step: any, index: number) => ({
      id: step.id || step.stepId || `step-${index}`,
      title: step.title || step.stepName || `Tour Step ${index + 1}`,
      description: step.description || step.stepDescription || "Explore this feature.",
      page: step.page || step.targetPage || step.navigationPath || "current",
      navigationPath: step.navigationPath || step.page || step.targetPage,
      targetPage: step.targetPage,
      route: step.route,
      icon: getIconForPage(step.navigationPath || step.page || step.targetPage || "current"),
      benefits: step.benefits || step.keyBenefits || [],
      actionText: step.actionText || "Continue",
      duration: step.duration || "2-3 min",
      voiceScript: step.voiceScript
    }));
  }
  
  // Final fallback to default welcome step if no tour found
  console.log("No tours available or no steps in tourData, using default welcome step");
  return [
    {
      id: "welcome",
      title: "Welcome to Your Demo",
      description: "Let's explore the key features that will transform your manufacturing operations.",
      page: "current",
      icon: Settings,
      benefits: ["See real-time production insights", "Experience intelligent scheduling", "Understand role-based workflows"],
      actionText: "Start Tour",
      duration: "25-35 min tour"
    }
  ];
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
    'current': Settings
  };
  return pageIcons[page] || Settings;
};

export function GuidedTour({ roleId, initialStep = 0, initialVoiceEnabled = false, onComplete, onSkip, onSwitchRole }: GuidedTourProps) {
  console.log("GuidedTour component mounted with roleId:", roleId, "initialVoiceEnabled:", initialVoiceEnabled);
  
  // State management
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isVisible, setIsVisible] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(initialVoiceEnabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [audioCompleted, setAudioCompleted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  // Navigation hook
  const [location, setLocation] = useLocation();
  
  // Refs
  const speechRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const preloadingSteps = useRef<Set<string>>(new Set());
  
  // Position state for draggable window
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Fetch role data
  const { data: roleData } = useQuery<RoleData>({
    queryKey: [`/api/roles/${roleId}`],
    enabled: !!roleId,
  });

  // Fetch tours from database
  const { data: toursFromAPI = [], isLoading: toursLoading } = useQuery<any[]>({
    queryKey: ['/api/tours'],
    staleTime: 0,
  });

  // Get tour steps
  const tourSteps = toursLoading ? [] : getTourStepsFromDatabase(roleId, toursFromAPI);
  const progress = tourSteps.length > 0 ? ((currentStep + 1) / tourSteps.length) * 100 : 0;

  // Initialize position
  useEffect(() => {
    const getInitialPosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth < 768;
      
      if (isMobile) {
        // Make mobile window ultra-compact with minimal white space
        const cardWidth = Math.min(280, windowWidth - 16);
        const maxCardHeight = Math.min(200, windowHeight * 0.35);
        const padding = 8;
        
        return {
          x: windowWidth - cardWidth - padding,
          y: windowHeight - maxCardHeight - padding
        };
      } else {
        const cardWidth = 384;
        const maxCardHeight = Math.min(600, windowHeight - 100);
        const padding = 20;
        
        return {
          x: windowWidth - cardWidth - padding,
          y: windowHeight - maxCardHeight - padding
        };
      }
    };

    setPosition(getInitialPosition());
  }, []);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset step when role changes
  useEffect(() => {
    setCurrentStep(0);
    setHasAutoStarted(false);
  }, [roleId]);

  // Auto-scroll function to demonstrate page features and content
  const performAutoScroll = useCallback(async () => {
    console.log('performAutoScroll called - checking page dimensions...');
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pageHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    
    console.log(`Page dimensions: height=${pageHeight}, viewport=${viewportHeight}, difference=${pageHeight - viewportHeight}`);
    
    // Always perform demo scroll to show page features (even if content fits)
    const shouldScroll = pageHeight > viewportHeight * 1.1; // More lenient threshold
    
    if (shouldScroll || pageHeight > viewportHeight + 20) {
      console.log('Auto-scrolling to demonstrate page features - starting scroll sequence');
      
      // Scroll to bottom slowly
      const scrollToBottom = () => {
        return new Promise<void>((resolve) => {
          const startTime = Date.now();
          const duration = 3000; // 3 seconds
          const startScrollTop = window.pageYOffset;
          const targetScrollTop = pageHeight - viewportHeight;
          
          const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out function for smooth scrolling
            const easeInOut = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easeInOut;
            window.scrollTo(0, currentScrollTop);
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            } else {
              resolve();
            }
          };
          
          requestAnimationFrame(animateScroll);
        });
      };
      
      // Scroll to top slowly
      const scrollToTop = () => {
        return new Promise<void>((resolve) => {
          const startTime = Date.now();
          const duration = 2000; // 2 seconds
          const startScrollTop = window.pageYOffset;
          
          const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeInOut = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentScrollTop = startScrollTop * (1 - easeInOut);
            window.scrollTo(0, currentScrollTop);
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            } else {
              resolve();
            }
          };
          
          requestAnimationFrame(animateScroll);
        });
      };
      
      // Wait 1 second, scroll down, pause, then scroll back up
      console.log('Starting scroll sequence: wait -> scroll down -> pause -> scroll up');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Scrolling down...');
      await scrollToBottom();
      console.log('Pausing at bottom...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Pause at bottom
      console.log('Scrolling back to top...');
      await scrollToTop();
      console.log('Auto-scroll sequence completed');
    } else {
      console.log('Page fits within viewport - performing demo scroll anyway to show features');
      
      // Even if page fits, do a gentle scroll demo to show users there's content to explore
      const gentleScrollDemo = async () => {
        console.log('Starting gentle demo scroll...');
        
        // Scroll down about 30% of viewport
        const scrollDistance = viewportHeight * 0.3;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        const startScrollTop = window.pageYOffset;
        
        const animateDown = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeInOut = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          window.scrollTo(0, startScrollTop + scrollDistance * easeInOut);
          
          if (progress < 1) {
            requestAnimationFrame(animateDown);
          } else {
            // Pause then scroll back
            setTimeout(async () => {
              console.log('Scrolling back to top...');
              const backStartTime = Date.now();
              const backDuration = 1500;
              
              const animateUp = () => {
                const elapsed = Date.now() - backStartTime;
                const progress = Math.min(elapsed / backDuration, 1);
                const easeInOut = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                window.scrollTo(0, startScrollTop + scrollDistance * (1 - easeInOut));
                
                if (progress < 1) {
                  requestAnimationFrame(animateUp);
                } else {
                  console.log('Demo scroll completed');
                }
              };
              
              requestAnimationFrame(animateUp);
            }, 1000);
          }
        };
        
        requestAnimationFrame(animateDown);
      };
      
      await gentleScrollDemo();
    }
  }, []);

  // Navigate to step page when step changes
  useEffect(() => {
    if (tourSteps.length > 0 && currentStep < tourSteps.length) {
      const currentStepData = tourSteps[currentStep];
      let targetPath = null;

      // Check for different navigation path properties
      if (currentStepData.navigationPath) {
        targetPath = currentStepData.navigationPath;
      } else if (currentStepData.page && currentStepData.page !== 'current') {
        targetPath = currentStepData.page;
      } else if (currentStepData.targetPage) {
        targetPath = currentStepData.targetPage;
      } else if (currentStepData.route) {
        targetPath = currentStepData.route;
      }

      // Navigate if we have a valid path and it's different from current location
      if (targetPath && targetPath !== 'current' && targetPath !== location) {
        console.log(`Tour navigating from ${location} to ${targetPath} for step: ${currentStepData.title}`);
        setLocation(targetPath);
        // Trigger auto-scroll after navigation
        console.log('Setting auto-scroll timeout after navigation...');
        setTimeout(() => {
          console.log('Auto-scroll timeout triggered after navigation');
          performAutoScroll();
        }, 500);
      } else {
        // If no navigation needed, still do auto-scroll to show content
        console.log('No navigation needed, triggering auto-scroll directly');
        performAutoScroll();
      }
    }
  }, [currentStep, tourSteps, location, setLocation, performAutoScroll]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAudioCompleted(false);
      stopSpeech();
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAudioCompleted(false);
      stopSpeech();
    }
  };

  const handleComplete = () => {
    stopSpeech();
    setShowRoleSelection(true);
  };

  const handleSkip = () => {
    stopSpeech();
    onSkip();
  };

  // Audio control functions
  const stopSpeech = () => {
    console.log("Stopping all speech and audio");
    
    if (speechRef.current) {
      try {
        speechRef.current.pause();
        speechRef.current.currentTime = 0;
        speechRef.current.onended = null;
        speechRef.current.onerror = null;
        speechRef.current = null;
      } catch (error) {
        console.error("Error stopping HTML5 audio:", error);
      }
    }
    
    setIsPlaying(false);
    setIsLoadingVoice(false);
  };

  const playPreloadedAudio = async (stepId: string) => {
    if (!voiceEnabled || isPlaying || isLoadingVoice) return;
    
    stopSpeech();
    
    const currentStepData = tourSteps.find(step => step.id === stepId);
    if (currentStepData) {
      const enhancedText = createEngagingNarration(currentStepData, roleData?.name || 'unknown');
      console.log(`Starting new audio for step: ${stepId}`);
      
      try {
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
          throw new Error(`Audio generation failed: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.preload = "auto";
        
        audio.onended = () => {
          setIsPlaying(false);
          setIsLoadingVoice(false);
          setAudioCompleted(true);
          speechRef.current = null;
          URL.revokeObjectURL(audioUrl);
          console.log("Audio playback completed");
          
          if (autoAdvance && currentStep < tourSteps.length - 1) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              handleNext();
            }, 2000);
          } else if (autoAdvance && currentStep === tourSteps.length - 1) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              handleComplete();
            }, 2000);
          }
        };
        
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setIsPlaying(false);
          setIsLoadingVoice(false);
          speechRef.current = null;
          URL.revokeObjectURL(audioUrl);
        };
          
        speechRef.current = audio;
        
        try {
          await audio.play();
          setIsLoadingVoice(false);
          setIsPlaying(true);
          console.log("Audio started playing");
        } catch (playError) {
          console.error("Auto-play failed:", playError);
          setIsPlaying(false);
          setIsLoadingVoice(false);
          URL.revokeObjectURL(audioUrl);
        }
        
      } catch (error) {
        console.error(`Failed to load audio for step ${stepId}:`, error);
        setIsPlaying(false);
        setIsLoadingVoice(false);
      }
    }
  };

  const toggleVoice = () => {
    if (isPlaying) return;
    
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    
    if (newVoiceEnabled && tourSteps[currentStep]) {
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };

  const togglePlayPause = () => {
    if (!voiceEnabled) return;
    
    if (isPlaying) {
      stopSpeech();
    } else if (tourSteps[currentStep]) {
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };

  // Auto-start voice if enabled
  useEffect(() => {
    if (initialVoiceEnabled && currentStep === 0 && tourSteps.length > 0 && !hasAutoStarted) {
      const timer = setTimeout(() => {
        console.log("Auto-starting voice for welcome step");
        setHasAutoStarted(true);
        playPreloadedAudio(tourSteps[0].id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialVoiceEnabled, tourSteps, currentStep, hasAutoStarted]);

  // Dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  // Role selection handlers
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

  const handleSwitchToRole = (newRoleId: number) => {
    console.log("Switching to role:", newRoleId);
    setShowRoleSelection(false);
    if (onSwitchRole) {
      onSwitchRole(newRoleId);
    }
  };

  const handleExitApplication = () => {
    window.location.href = '/';
  };

  const handleFinishAllTours = () => {
    setShowRoleSelection(false);
    onComplete();
  };

  // Component rendering
  if (toursLoading) {
    return <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded shadow">Loading...</div>;
  }
  
  if (!isVisible) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  const StepIcon = currentStepData?.icon || Settings;

  if (!currentStepData) return null;

  return (
    <>
      {/* Light backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40 pointer-events-none"></div>
      
      {/* Draggable tour window */}
      <Card 
        ref={cardRef}
        className="fixed bg-white shadow-2xl z-50 cursor-move flex flex-col md:w-96"
        style={{
          left: position.x,
          top: position.y,
          width: windowSize.width < 768 ? `${Math.min(280, windowSize.width - 16)}px` : '384px',
          height: windowSize.width < 768 ? 
            `${Math.min(200, windowSize.height * 0.35)}px` : 
            `${Math.min(600, windowSize.height - 100)}px`,
          maxHeight: windowSize.width < 768 ? '35vh' : '90vh'
        }}
      >
        <CardHeader 
          className="relative cursor-move flex-shrink-0 p-1.5 sm:p-6 pb-1 sm:pb-6"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Move className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Badge variant="secondary" className="text-xs sm:text-sm px-1 sm:px-2">
                {roleData?.name || 'Demo'} Demo
              </Badge>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
              >
                {voiceEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-start gap-1 sm:gap-2">
              <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <CardTitle className="text-xs sm:text-lg font-semibold leading-tight sm:leading-normal line-clamp-2">{currentStepData.title}</CardTitle>
            </div>
            <Progress value={progress} className="w-full h-1.5 sm:h-2" />
            <p className="text-xs text-gray-500">
              {currentStep + 1}/{tourSteps.length} <span className="hidden sm:inline">• {currentStepData.duration}</span>
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-1 sm:p-6 pt-0">
          <div className="space-y-0 sm:space-y-4">
            {/* Hide description on mobile to save space */}
            <p className="hidden sm:block text-sm text-gray-700 leading-relaxed">{currentStepData.description}</p>
            
            {currentStepData.benefits && currentStepData.benefits.length > 0 && (
              <div className="space-y-2 hidden sm:block">
                <h4 className="text-sm font-medium text-gray-900">Key Benefits:</h4>
                <ul className="space-y-1">
                  {currentStepData.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>

        <div className="flex-shrink-0 p-1.5 sm:p-6 pt-1 sm:pt-2 border-t space-y-1 sm:space-y-3">
          {voiceEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Voice Guide</span>
              <div className="flex items-center gap-2">
                {isLoadingVoice && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  disabled={isLoadingVoice}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playPreloadedAudio(tourSteps[currentStep]?.id)}
                  disabled={isLoadingVoice || !tourSteps[currentStep]}
                  className="h-8 w-8 p-0"
                  title="Replay voice narration"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  Complete
                  <CheckCircle className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            <Button
              variant={autoAdvance ? "default" : "outline"}
              onClick={() => {
                const newAutoAdvance = !autoAdvance;
                setAutoAdvance(newAutoAdvance);
                // If turning on auto-advance and audio has completed, advance immediately
                if (newAutoAdvance && audioCompleted && currentStep < tourSteps.length - 1) {
                  setTimeout(() => handleNext(), 500);
                }
              }}
              className={`h-10 px-3 ${autoAdvance ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              title={autoAdvance ? "Auto-advance enabled" : "Auto-advance disabled"}
            >
              {autoAdvance ? (
                <>
                  <Timer className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              ) : (
                <>
                  <TimerOff className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Manual</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Role Selection Dialog */}
      <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Tour Complete!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Great job! You've completed the {roleData?.name} demo tour.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Try Another Role:</h4>
              {getAvailableRoles().map((availableRole) => (
                <Button
                  key={availableRole.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleSwitchToRole(1)} // Default to role ID 1 for demo
                >
                  <availableRole.icon className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">{availableRole.name}</div>
                    <div className="text-xs text-gray-500">
                      {availableRole.description.length > 50 
                        ? `${availableRole.description.substring(0, 50)}...` 
                        : availableRole.description
                      }
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Star className="h-4 w-4 mr-2" />
                View Pricing & Plans
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleExitApplication}
                  variant="outline" 
                  className="flex-1"
                >
                  Exit Demo
                </Button>
                <Button 
                  onClick={handleFinishAllTours}
                  variant="outline"
                  className="flex-1"
                >
                  Explore More
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}