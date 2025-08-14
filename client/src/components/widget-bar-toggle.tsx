import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelTopOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidgetBar } from '@/contexts/WidgetBarContext';

interface WidgetBarToggleProps {
  className?: string;
}

const WidgetBarToggle: React.FC<WidgetBarToggleProps> = ({ className }) => {
  const { settings, toggleVisibility } = useWidgetBar();

  if (settings.isVisible) {
    return null; // Don't show the toggle when widget bar is visible
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVisibility}
            className={cn(
              "fixed z-50 bg-background/95 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200",
              // Position based on where the widget bar would appear
              getTogglePosition(settings.position),
              className
            )}
          >
            <PanelTopOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Show Widget Bar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const getTogglePosition = (position: 'top' | 'bottom' | 'left' | 'right') => {
  switch (position) {
    case 'top':
      return 'top-4 right-4';
    case 'bottom':
      return 'bottom-4 right-4';
    case 'left':
      return 'top-4 left-4';
    case 'right':
      return 'top-4 right-4';
    default:
      return 'top-4 right-4';
  }
};

export default WidgetBarToggle;