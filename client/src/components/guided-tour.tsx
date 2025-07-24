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
  Volume1,
  VolumeX,
  Pause,
  RotateCcw,
  Kanban,
  Timer,
  TimerOff,
  Star,
  ScrollText
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
  
  return `${intro}. ${step.description}${benefits}`;
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
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  // Navigation hook
  const [location, setLocation] = useLocation();
  
  // Refs
  const speechRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const preloadingSteps = useRef<Set<string>>(new Set());
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize position and dimensions
  useEffect(() => {
    const getInitialPosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth < 768;
      
      console.log("Initializing tour window position:", { windowWidth, windowHeight, isMobile });
      
      if (isMobile) {
        // Mobile window positioning - ALWAYS in viewport LOWER RIGHT
        const cardWidth = Math.min(280, windowWidth - 16);
        const cardHeight = Math.min(200, windowHeight * 0.35);
        const padding = 8;
        const bottomPosition = windowHeight - cardHeight - padding - 2; // Very minimal gap from bottom
        
        const position = {
          x: windowWidth - cardWidth - padding,
          y: bottomPosition
        };
        
        console.log("Mobile tour position calculated (lower right):", position, "cardHeight:", cardHeight, "windowHeight:", windowHeight);
        return position;
      } else {
        // Desktop positioning - ALWAYS in viewport bottom-right 
        const cardWidth = 384;
        const cardHeight = Math.min(600, windowHeight - 100);
        const padding = 20;
        const bottomPosition = windowHeight - cardHeight - padding - 20; // Position near bottom edge
        
        // Set initial window dimensions for desktop
        setWindowDimensions({ width: cardWidth, height: cardHeight });
        
        const position = {
          x: windowWidth - cardWidth - padding,
          y: bottomPosition
        };
        
        console.log("Desktop tour position calculated:", position);
        return position;
      }
    };

    const initialPosition = getInitialPosition();
    setPosition(initialPosition);
    console.log("Tour window position set to:", initialPosition);
  }, []);

  // Tour window positioning - verify Card element is positioned correctly
  useEffect(() => {
    if (cardRef.current && tourSteps.length > 0) {
      console.log("Tour window positioned and ready");
      
      // Log actual Card element position
      setTimeout(() => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          console.log("Actual Card element position:", {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.top >= 0 && rect.left >= 0 && rect.top < window.innerHeight && rect.left < window.innerWidth
          });
        }
      }, 100);
    }
  }, [tourSteps.length, position]); // Trigger when tour data loads or position changes

  // Window resize handler and position adjustment
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      
      // Reposition tour window to ensure it stays visible after resize
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth < 768;
      
      console.log("Resize event - repositioning tour window:", { windowWidth, windowHeight, isMobile });
      
      if (isMobile) {
        const cardWidth = Math.min(280, windowWidth - 16);
        const padding = 8;
        const topPosition = 60; // Fixed viewport position
        
        const newPosition = {
          x: windowWidth - cardWidth - padding,
          y: topPosition
        };
        
        console.log("Resize - Mobile position:", newPosition);
        setPosition(newPosition);
      } else {
        const cardWidth = 384;
        const cardHeight = Math.min(600, windowHeight - 100);
        const padding = 20;
        const bottomPosition = windowHeight - cardHeight - padding - 20; // Position near bottom edge
        
        const newPosition = {
          x: windowWidth - cardWidth - padding,
          y: bottomPosition
        };
        
        console.log("Resize - Desktop position:", newPosition);
        setPosition(newPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset step when role changes and prevent auto-voice restart
  useEffect(() => {
    setCurrentStep(0);
    setHasAutoStarted(false);
    setAudioCompleted(false);
    stopSpeech(); // Stop any playing audio when switching roles
    
    // Clear session storage for old role to prevent conflicts
    const oldKeys = Object.keys(sessionStorage).filter(key => key.startsWith('tour-') && key.includes('-auto-played'));
    oldKeys.forEach(key => sessionStorage.removeItem(key));
  }, [roleId]);

  // Enhanced auto-scroll function to demonstrate page content
  const performAutoScroll = useCallback(async () => {
    console.log('performAutoScroll called - checking page dimensions...');
    
    // Check if auto-scroll is enabled by user
    if (!autoScrollEnabled) {
      console.log('Auto-scroll disabled by user - skipping content demonstration');
      return;
    }
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // First try to scroll the main window if there's content below the fold
    const windowScrollable = document.documentElement.scrollHeight > window.innerHeight;
    const currentWindowScroll = window.pageYOffset || document.documentElement.scrollTop;
    const maxWindowScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    console.log(`Window scroll check:
      - scrollHeight: ${document.documentElement.scrollHeight}
      - viewportHeight: ${window.innerHeight}
      - currentScroll: ${currentWindowScroll}
      - maxScroll: ${maxWindowScroll}
      - windowScrollable: ${windowScrollable}`);
    
    if (windowScrollable && maxWindowScroll > 100) {
      console.log('Performing main window auto-scroll to demonstrate page content...');
      await performWindowScrollDemo();
      return;
    }
    
    // If window doesn't scroll, try content containers
    const contentContainer = 
      document.querySelector('[class*="space-y-4"], [class*="space-y-6"]') ||
      document.querySelector('main > div') ||
      document.querySelector('[class*="p-3"], [class*="p-6"]') ||
      document.querySelector('main') ||
      document.querySelector('#root > div:first-child');
    
    if (!contentContainer) {
      console.log('No suitable content container found for auto-scroll');
      return;
    }
    
    const containerHeight = contentContainer.scrollHeight;
    const containerClientHeight = contentContainer.clientHeight;
    const containerScrollTop = contentContainer.scrollTop;
    const maxScrollableDistance = containerHeight - containerClientHeight;
    
    console.log(`Content container auto-scroll: 
      - container: ${contentContainer.tagName}.${contentContainer.className}
      - scrollHeight: ${containerHeight}
      - clientHeight: ${containerClientHeight}
      - maxScrollable: ${maxScrollableDistance}`);
    
    // Check if container has scrollable content
    if (maxScrollableDistance <= 10) {
      console.log('Content container has no scrollable content - skipping auto-scroll');
      return;
    }
    
    await performContentScrollDemo();
  }, [autoScrollEnabled]);
  
  // Function to scroll the main window to show page content
  const performWindowScrollDemo = async () => {
    console.log('Starting main window scroll demonstration...');
    
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate gentle scroll distance - show content but don't scroll too aggressively
    const scrollDistance = Math.min(
      maxScroll - currentScroll, // Don't scroll past the end
      window.innerHeight * 0.5, // Scroll half viewport height
      400 // Maximum 400px scroll
    );
    
    if (scrollDistance > 50) {
      console.log(`Window scrolling ${scrollDistance}px to demonstrate page content...`);
      
      // Smooth scroll down
      await new Promise<void>((resolve) => {
        const targetScroll = currentScroll + scrollDistance;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animateScroll = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease-in-out curve
          const easeInOut = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          const newScrollTop = currentScroll + scrollDistance * easeInOut;
          window.scrollTo(0, newScrollTop);
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(animateScroll);
      });
      
      // Pause to let user see the content
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Smooth scroll back to original position
      await new Promise<void>((resolve) => {
        const targetScroll = currentScroll;
        const duration = 1500; // 1.5 seconds to scroll back
        const startTime = Date.now();
        
        const animateScroll = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease-in-out curve
          const easeInOut = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          const newScrollTop = currentScroll + scrollDistance - (scrollDistance * easeInOut);
          window.scrollTo(0, newScrollTop);
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(animateScroll);
      });
      
      console.log('Main window scroll demonstration complete');
    }
  };
  
  // Function to scroll content containers
  const performContentScrollDemo = async () => {
    // Find the content container first
    const contentContainer = 
      document.querySelector('[class*="space-y-4"], [class*="space-y-6"]') ||
      document.querySelector('main > div') ||
      document.querySelector('[class*="p-3"], [class*="p-6"]') ||
      document.querySelector('main') ||
      document.querySelector('#root > div:first-child');
    
    if (!contentContainer) {
      console.log('No content container found for scrolling');
      return;
    }
    
    const containerHeight = contentContainer.scrollHeight;
    const containerClientHeight = contentContainer.clientHeight;
    const containerScrollTop = contentContainer.scrollTop;
    const maxScrollableDistance = containerHeight - containerClientHeight;
    
    console.log('Starting content container auto-scroll demo...');
    
    // Calculate scroll distance for content container
    const scrollableDistance = Math.min(
      maxScrollableDistance - containerScrollTop, // Don't scroll past the end
      containerClientHeight * 0.5, // Scroll half the container height
      300 // Never scroll more than 300px in container
    );
      
      if (scrollableDistance > 50) { // Only scroll if there's meaningful content to show
        console.log(`Content container scroll: ${scrollableDistance}px to reveal hidden content (max possible: ${maxScrollableDistance - containerScrollTop}px)...`);
        
        // Scroll down within content container to show hidden content
        const scrollDown = () => {
          return new Promise<void>((resolve) => {
            const targetScrollTop = containerScrollTop + scrollableDistance;
            
            const duration = 2000; // 2 seconds to scroll down
            const startTime = Date.now();
            const startScrollTop = containerScrollTop;
            
            const animateScroll = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
              
              const newScrollTop = Math.min(startScrollTop + scrollableDistance * easeInOut, maxScrollableDistance);
              
              // Scroll only the content container, not the entire page
              contentContainer.scrollTop = newScrollTop;
              
              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              } else {
                console.log(`Content scroll complete - container now at position: ${contentContainer.scrollTop}`);
                resolve();
              }
            };
            
            requestAnimationFrame(animateScroll);
          });
        };
        
        // Scroll back to top of content container
        const scrollToTop = () => {
          return new Promise<void>((resolve) => {
            const startingPosition = contentContainer.scrollTop;
            
            if (startingPosition <= 10) {
              resolve();
              return;
            }
            
            console.log(`Scrolling content container back to top from position: ${startingPosition}`);
            const duration = 2000; // 2 seconds to scroll back up
            const startTime = Date.now();
            
            const animateScroll = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
              
              const newScrollTop = startingPosition * (1 - easeInOut);
              
              // Scroll only the content container
              contentContainer.scrollTop = newScrollTop;
              
              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              } else {
                console.log('Content container returned to top position');
                resolve();
              }
            };
            
            requestAnimationFrame(animateScroll);
          });
        };
        
        // Execute content container scroll sequence
        await scrollDown();
        console.log('Pausing to show content...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
        await scrollToTop();
        console.log('Content container auto-scroll sequence completed');
      } else {
        console.log(`Insufficient content to scroll - only ${scrollableDistance}px available`);
      }
  };

  // Auto-scroll is now properly completed

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
      // Only restart voice if user didn't manually pause it
      const shouldContinueVoice = voiceEnabled && !isPausedByUser;
      
      setCurrentStep(currentStep + 1);
      setAudioCompleted(false);
      stopSpeech();
      
      // If voice should continue and wasn't paused by user, start it for the new step
      if (shouldContinueVoice && tourSteps[currentStep + 1]) {
        setTimeout(() => {
          playPreloadedAudio(tourSteps[currentStep + 1].id);
        }, 600); // Small delay to allow navigation to complete
      }
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Only restart voice if user didn't manually pause it
      const shouldContinueVoice = voiceEnabled && !isPausedByUser;
      
      setCurrentStep(currentStep - 1);
      setAudioCompleted(false);
      stopSpeech();
      
      // If voice should continue and wasn't paused by user, start it for the new step
      if (shouldContinueVoice && tourSteps[currentStep - 1]) {
        setTimeout(() => {
          playPreloadedAudio(tourSteps[currentStep - 1].id);
        }, 600); // Small delay to allow navigation to complete
      }
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
        audio.volume = volume; // Set volume control
        
        audio.onended = () => {
          setIsPlaying(false);
          setIsLoadingVoice(false);
          setAudioCompleted(true);
          setIsPausedByUser(false); // Reset pause state when audio completes naturally
          speechRef.current = null;
          URL.revokeObjectURL(audioUrl);
          console.log("Audio playback completed - voice will not auto-replay");
          
          // Auto-advance if enabled and continue voice on next step
          if (autoAdvance && currentStep < tourSteps.length - 1) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              // Set voice as enabled so handleNext will continue voice playback
              setVoiceEnabled(true);
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
        currentAudio.current = audio; // Update current audio reference for volume control
        
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
    setIsPausedByUser(false); // Reset pause state when toggling voice
    
    if (newVoiceEnabled && tourSteps[currentStep]) {
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };

  const togglePlayPause = () => {
    if (!voiceEnabled) return;
    
    if (isPlaying) {
      setIsPausedByUser(true); // Track that user manually paused
      stopSpeech();
    } else {
      setIsPausedByUser(false); // User is manually playing
      if (tourSteps[currentStep]) {
        playPreloadedAudio(tourSteps[currentStep].id);
      }
    }
  };

  // Auto-start voice only once for initial step if enabled
  useEffect(() => {
    // Create a unique session key for this specific tour session
    const sessionKey = `tour-${roleId}-step-${currentStep}-auto-played`;
    const hasAlreadyPlayed = sessionStorage.getItem(sessionKey);
    
    if (initialVoiceEnabled && currentStep === 0 && tourSteps.length > 0 && !hasAutoStarted && !hasAlreadyPlayed) {
      const timer = setTimeout(() => {
        console.log("Auto-starting voice for welcome step");
        setHasAutoStarted(true);
        setVoiceEnabled(true);
        sessionStorage.setItem(sessionKey, 'true');
        playPreloadedAudio(tourSteps[0].id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialVoiceEnabled, tourSteps, currentStep, hasAutoStarted, roleId]);

  // Dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing functionality
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [windowDimensions, setWindowDimensions] = useState({
    width: 384,
    height: 600
  });
  const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 });
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0 });
  const [resizeStartWindowPosition, setResizeStartWindowPosition] = useState({ x: 0, y: 0 });

  // Volume control (desktop only)
  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Click outside handler for volume slider
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVolumeSlider]);

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

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartPosition({ x: e.clientX, y: e.clientY });
    setResizeStartDimensions({ ...windowDimensions });
    setResizeStartWindowPosition({ ...position });
  };

  const getResizeCursor = (direction: string) => {
    switch (direction) {
      case 'n': return 'cursor-n-resize';
      case 's': return 'cursor-s-resize';
      case 'e': return 'cursor-e-resize';
      case 'w': return 'cursor-w-resize';
      case 'ne': return 'cursor-ne-resize';
      case 'nw': return 'cursor-nw-resize';
      case 'se': return 'cursor-se-resize';
      case 'sw': return 'cursor-sw-resize';
      default: return '';
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Add boundary checking to keep window in viewport
        const newX = Math.max(0, Math.min(windowSize.width - windowDimensions.width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(windowSize.height - windowDimensions.height, e.clientY - dragOffset.y));
        setPosition({
          x: newX,
          y: newY
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPosition.x;
        const deltaY = e.clientY - resizeStartPosition.y;
        
        let newWidth = resizeStartDimensions.width;
        let newHeight = resizeStartDimensions.height;
        let newX = position.x;
        let newY = position.y;

        // Apply resizing based on direction
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, resizeStartDimensions.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, resizeStartDimensions.width - deltaX);
          newX = resizeStartWindowPosition.x - (newWidth - resizeStartDimensions.width);
        }
        if (resizeDirection.includes('s')) {
          // Dynamic minimum height based on compact mode
          const minHeight = windowDimensions.height < 300 ? 120 : 200;
          newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          // Dynamic minimum height based on compact mode
          const minHeight = windowDimensions.height < 300 ? 120 : 200;
          newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
          newY = resizeStartWindowPosition.y - (newHeight - resizeStartDimensions.height);
        }

        // Simple boundary constraints to prevent window from going off screen
        // Constrain width and height to viewport
        newWidth = Math.min(newWidth, windowSize.width);
        newHeight = Math.min(newHeight, windowSize.height);
        
        // For west/north resizing, ensure position doesn't go negative
        if (resizeDirection.includes('w')) {
          newX = Math.max(0, newX);
        }
        if (resizeDirection.includes('n')) {
          newY = Math.max(0, newY);
        }
        
        // Ensure the window fits within viewport after position adjustment
        if (newX + newWidth > windowSize.width) {
          newWidth = windowSize.width - newX;
        }
        if (newY + newHeight > windowSize.height) {
          newHeight = windowSize.height - newY;
        }

        // Safeguard: Reset to default if dimensions become invalid (but allow smaller sizes in compact mode)
        const minWidth = 200;
        const minHeight = newHeight < 150 ? 120 : 150;
        if (newWidth < minWidth || newHeight < minHeight) {
          console.log('Invalid dimensions detected during resize, resetting to defaults');
          setWindowDimensions({ width: 384, height: 600 });
          setPosition({
            x: windowSize.width - 384 - 20,
            y: Math.max(20, windowSize.height - 600 - 40)
          });
          return;
        }

        // Update dimensions
        setWindowDimensions({ width: newWidth, height: newHeight });
        
        // Update position if resizing from north or west
        if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        // Add boundary checking to keep window in viewport
        const newX = Math.max(0, Math.min(windowSize.width - windowDimensions.width, touch.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(windowSize.height - windowDimensions.height, touch.clientY - dragOffset.y));
        setPosition({
          x: newX,
          y: newY
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing, dragOffset, resizeDirection, resizeStartPosition, resizeStartDimensions, position]);

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
      
      {/* Draggable and resizable tour window - FORCE viewport positioning */}
      <Card 
        ref={cardRef}
        className="bg-white shadow-2xl z-50 flex flex-col"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: windowSize.width < 768 ? 
            `${Math.min(280, windowSize.width - 16)}px` : 
            `${windowDimensions.width}px`,
          height: windowSize.width < 768 ? 
            `${Math.min(200, windowSize.height * 0.35)}px` : 
            `${windowDimensions.height}px`,
          maxHeight: windowSize.width < 768 ? '35vh' : '90vh',
          cursor: isDragging ? 'grabbing' : isResizing ? 'default' : 'default'
        }}
      >
        <CardHeader 
          className={`relative flex-shrink-0 p-1.5 sm:p-6 pb-1 sm:pb-6 ${
            isResizing ? 'cursor-default' : 'cursor-move'
          }`}
          onMouseDown={!isResizing ? handleMouseDown : undefined}
          onTouchStart={!isResizing ? handleTouchStart : undefined}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Move className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Badge variant="secondary" className="text-xs sm:text-sm px-1 sm:px-2">
                {roleData?.name || 'Demo'} Demo
              </Badge>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Desktop volume control */}
              {windowSize.width >= 768 && (
                <div className="relative" ref={volumeSliderRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    className="h-8 w-8 p-0"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  >
                    {volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  {showVolumeSlider && (
                    <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-3 w-3 text-gray-500" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => {
                            const newVolume = parseFloat(e.target.value);
                            setVolume(newVolume);
                            // Update current audio volume if playing
                            if (currentAudio.current) {
                              currentAudio.current.volume = newVolume;
                            }
                          }}
                          className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <Volume2 className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        {Math.round(volume * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                title={autoScrollEnabled ? "Disable auto-scroll content demo" : "Enable auto-scroll content demo"}
              >
                <ScrollText className={`h-3 w-3 sm:h-4 sm:w-4 ${autoScrollEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
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

        <CardContent className={`flex-1 overflow-y-auto pt-0 ${windowDimensions.height < 200 ? 'p-1 min-h-0' : windowDimensions.height < 300 ? 'p-2 min-h-0' : 'p-1 sm:p-6'}`}>
          <div className={`${windowDimensions.height < 200 ? 'space-y-0' : 'space-y-0 sm:space-y-4'}`}>
            {/* Hide description when window is very small or on mobile */}
            {windowDimensions.height >= 200 && (
              <p className="hidden sm:block text-sm text-gray-700 leading-relaxed">{currentStepData.description}</p>
            )}
            
            {currentStepData.benefits && currentStepData.benefits.length > 0 && windowDimensions.height >= 250 && (
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

        <div className={`flex-shrink-0 border-t ${windowDimensions.height < 200 ? 'p-1 space-y-1' : windowDimensions.height < 300 ? 'p-2 space-y-2' : 'p-1.5 sm:p-6 pt-1 sm:pt-2 space-y-1 sm:space-y-3'}`}>
          {voiceEnabled && windowDimensions.height >= 150 && (
            <div className="flex items-center justify-between">
              <span className={`${windowDimensions.height < 200 ? 'text-xs' : 'text-sm'} text-gray-600`}>Voice Guide</span>
              <div className="flex items-center gap-1">
                {isLoadingVoice && (
                  <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  disabled={isLoadingVoice}
                  className={`${windowDimensions.height < 200 ? 'h-6 w-6' : 'h-8 w-8'} p-0`}
                >
                  {isPlaying ? <Pause className={`${windowDimensions.height < 200 ? 'h-3 w-3' : 'h-4 w-4'}`} /> : <Play className={`${windowDimensions.height < 200 ? 'h-3 w-3' : 'h-4 w-4'}`} />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playPreloadedAudio(tourSteps[currentStep]?.id)}
                  disabled={isLoadingVoice || !tourSteps[currentStep]}
                  className={`${windowDimensions.height < 200 ? 'h-6 w-6' : 'h-8 w-8'} p-0`}
                  title="Replay voice narration"
                >
                  <RotateCcw className={`${windowDimensions.height < 200 ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>
          )}

          <div className={`flex ${windowDimensions.height < 200 ? 'gap-1' : 'gap-2'}`}>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex-1 ${windowDimensions.height < 200 ? 'h-7 text-xs px-2' : windowDimensions.height < 250 ? 'h-8 text-sm px-3' : ''}`}
            >
              <ChevronLeft className={`${windowDimensions.height < 200 ? 'h-3 w-3 mr-0.5' : 'h-4 w-4 mr-1'}`} />
              {windowDimensions.height < 200 ? 'Prev' : 'Previous'}
            </Button>
            
            <Button
              onClick={handleNext}
              className={`flex-1 bg-blue-600 hover:bg-blue-700 ${windowDimensions.height < 200 ? 'h-7 text-xs px-2' : windowDimensions.height < 250 ? 'h-8 text-sm px-3' : ''}`}
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  {windowDimensions.height < 200 ? 'Done' : 'Complete'}
                  <CheckCircle className={`${windowDimensions.height < 200 ? 'h-3 w-3 ml-0.5' : 'h-4 w-4 ml-1'}`} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className={`${windowDimensions.height < 200 ? 'h-3 w-3 ml-0.5' : 'h-4 w-4 ml-1'}`} />
                </>
              )}
            </Button>

            {windowDimensions.height >= 180 && (
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
                className={`${windowDimensions.height < 200 ? 'h-7 px-2' : windowDimensions.height < 250 ? 'h-8 px-3' : 'h-10 px-3'} ${autoAdvance ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                title={autoAdvance ? "Auto-advance enabled" : "Auto-advance disabled"}
              >
                {autoAdvance ? (
                  <>
                    <Timer className={`${windowDimensions.height < 200 ? 'h-3 w-3 mr-0.5' : 'h-4 w-4 mr-1'}`} />
                    <span className="hidden sm:inline">{windowDimensions.height < 200 ? '' : 'Auto'}</span>
                  </>
                ) : (
                  <>
                    <TimerOff className={`${windowDimensions.height < 200 ? 'h-3 w-3 mr-0.5' : 'h-4 w-4 mr-1'}`} />
                    <span className="hidden sm:inline">{windowDimensions.height < 200 ? '' : 'Manual'}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Resize handles - only on desktop */}
        {windowSize.width >= 768 && (
          <>
            {/* Corner handles */}
            <div 
              className={`absolute top-0 left-0 w-3 h-3 ${getResizeCursor('nw')}`}
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div 
              className={`absolute top-0 right-0 w-3 h-3 ${getResizeCursor('ne')}`}
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div 
              className={`absolute bottom-0 left-0 w-3 h-3 ${getResizeCursor('sw')}`}
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div 
              className={`absolute bottom-0 right-0 w-3 h-3 ${getResizeCursor('se')}`}
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            
            {/* Edge handles */}
            <div 
              className={`absolute top-0 left-3 right-3 h-1 ${getResizeCursor('n')}`}
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div 
              className={`absolute bottom-0 left-3 right-3 h-1 ${getResizeCursor('s')}`}
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div 
              className={`absolute left-0 top-3 bottom-3 w-1 ${getResizeCursor('w')}`}
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div 
              className={`absolute right-0 top-3 bottom-3 w-1 ${getResizeCursor('e')}`}
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
          </>
        )}
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