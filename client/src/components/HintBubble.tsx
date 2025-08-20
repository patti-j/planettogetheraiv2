import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Lightbulb, AlertTriangle, GraduationCap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface Hint {
  id: number;
  key: string;
  title: string;
  content: string;
  type: 'info' | 'tip' | 'warning' | 'tutorial';
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';
  trigger?: 'hover' | 'click' | 'auto' | 'manual';
  userStatus?: 'unseen' | 'seen' | 'dismissed' | 'completed';
  shouldShow?: boolean;
}

interface HintBubbleProps {
  hint: Hint;
  onDismiss?: () => void;
  onComplete?: () => void;
}

const HintBubble: React.FC<HintBubbleProps> = ({ hint, onDismiss, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Element | null>(null);

  // Mark hint as seen
  const markSeenMutation = useMutation({
    mutationFn: (hintId: number) => apiRequest(`/api/hints/${hintId}/seen`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hints'] });
    },
  });

  // Dismiss hint
  const dismissMutation = useMutation({
    mutationFn: (hintId: number) => apiRequest(`/api/hints/${hintId}/dismiss`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hints'] });
      setIsVisible(false);
      onDismiss?.();
    },
  });

  // Complete hint (for tutorials)
  const completeMutation = useMutation({
    mutationFn: (hintId: number) => apiRequest(`/api/hints/${hintId}/complete`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hints'] });
      setIsVisible(false);
      onComplete?.();
    },
  });

  // Calculate position based on target element
  const calculatePosition = () => {
    if (!targetRef.current || !bubbleRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    const margin = 12; // Margin from target

    // Position calculation based on hint position
    switch (hint.position) {
      case 'top':
        top = targetRect.top - bubbleRect.height - margin;
        left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
        left = targetRect.left - bubbleRect.width - margin;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
        left = targetRect.right + margin;
        break;
      case 'center':
        top = (viewportHeight - bubbleRect.height) / 2;
        left = (viewportWidth - bubbleRect.width) / 2;
        break;
      default: // auto
        // Try bottom first
        if (targetRect.bottom + bubbleRect.height + margin < viewportHeight) {
          top = targetRect.bottom + margin;
          left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
        } 
        // Try top
        else if (targetRect.top - bubbleRect.height - margin > 0) {
          top = targetRect.top - bubbleRect.height - margin;
          left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
        }
        // Try right
        else if (targetRect.right + bubbleRect.width + margin < viewportWidth) {
          top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
          left = targetRect.right + margin;
        }
        // Default to left
        else {
          top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
          left = targetRect.left - bubbleRect.width - margin;
        }
    }

    // Keep within viewport bounds
    top = Math.max(margin, Math.min(top, viewportHeight - bubbleRect.height - margin));
    left = Math.max(margin, Math.min(left, viewportWidth - bubbleRect.width - margin));

    setPosition({ top, left });
  };

  useEffect(() => {
    // Find target element if specified
    if (hint.target) {
      targetRef.current = document.querySelector(hint.target);
    }

    // Setup visibility based on trigger
    if (hint.trigger === 'auto' || !hint.trigger) {
      setIsVisible(true);
      if (hint.userStatus === 'unseen') {
        markSeenMutation.mutate(hint.id);
      }
    } else if (hint.trigger === 'hover' && targetRef.current) {
      const handleMouseEnter = () => {
        setIsVisible(true);
        if (hint.userStatus === 'unseen') {
          markSeenMutation.mutate(hint.id);
        }
      };
      const handleMouseLeave = () => setIsVisible(false);

      targetRef.current.addEventListener('mouseenter', handleMouseEnter);
      targetRef.current.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        targetRef.current?.removeEventListener('mouseenter', handleMouseEnter);
        targetRef.current?.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [hint]);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition);

      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition);
      };
    }
  }, [isVisible]);

  // Get icon based on hint type
  const getIcon = () => {
    switch (hint.type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'tip':
        return <Lightbulb className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'tutorial':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get color scheme based on hint type
  const getColorClass = () => {
    switch (hint.type) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
      case 'tip':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
      case 'tutorial':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100';
    }
  };

  if (!isVisible || !hint.shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={bubbleRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={`fixed z-[100] pointer-events-auto`}
        style={{ top: position.top, left: position.left }}
      >
        <Card className={`max-w-sm p-4 shadow-lg border ${getColorClass()}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getIcon()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{hint.title}</h4>
                <p className="text-sm opacity-90">{hint.content}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={() => dismissMutation.mutate(hint.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {hint.type === 'tutorial' && (
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dismissMutation.mutate(hint.id)}
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={() => completeMutation.mutate(hint.id)}
              >
                Got it
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Main component to manage all hints on a page
export const HintSystem: React.FC = () => {
  const [location] = useLocation();
  
  // Fetch hints for current page
  const { data: hints = [] } = useQuery({
    queryKey: ['/api/hints', location],
    queryFn: async () => {
      const response = await fetch(`/api/hints?page=${encodeURIComponent(location)}`);
      if (!response.ok) throw new Error('Failed to fetch hints');
      return response.json();
    },
  });

  // Filter hints that should be shown
  const visibleHints = hints.filter((hint: Hint) => hint.shouldShow);

  return (
    <>
      {visibleHints.map((hint: Hint) => (
        <HintBubble key={hint.id} hint={hint} />
      ))}
    </>
  );
};

export default HintBubble;