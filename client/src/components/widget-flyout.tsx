import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Pin, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWidgetComponent } from '@/lib/widget-registry';

interface WidgetFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onPin?: () => void;
  onMaximize?: () => void;
  widgetType: string;
  widgetTitle: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  anchorElement?: HTMLElement | null;
}

const WidgetFlyout: React.FC<WidgetFlyoutProps> = ({
  isOpen,
  onClose,
  onPin,
  onMaximize,
  widgetType,
  widgetTitle,
  position = 'top-right',
  anchorElement
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the anchor element
        if (anchorElement && anchorElement.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorElement]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get widget component
  const WidgetComponent = getWidgetComponent(widgetType);
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-16 right-4',
    'top-left': 'top-16 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const renderWidget = () => {
    if (!WidgetComponent) {
      return (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Widget type "{widgetType}" not found.
        </div>
      );
    }

    // Configuration based on widget type and compact mode
    const getCompactConfig = () => {
      switch (widgetType) {
        case 'custom-kpi':
          return { 
            view: 'compact', 
            showTrends: true, 
            showTargets: true, 
            maxKPIs: 3,
            compact: true,
            kpis: ['oee', 'yield', 'throughput'] 
          };
        case 'operation-sequencer':
          return { 
            isDesktop: true, 
            view: 'list',
            compact: true,
            maxItems: 5
          };
        case 'schedule-optimizer':
          return { 
            showOptimizer: true,
            compact: true,
            hideAdvanced: true
          };
        default:
          return { compact: true };
      }
    };

    return (
      <WidgetComponent
        title={widgetTitle}
        configuration={getCompactConfig()}
        className="w-full"
      />
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" />
      
      {/* Flyout Panel */}
      <Card 
        ref={flyoutRef}
        className={cn(
          "fixed z-50 w-80 max-w-[90vw] max-h-[80vh] shadow-2xl border-border/50",
          "bg-background/95 backdrop-blur-sm",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
          positionClasses[position]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <h3 className="font-semibold text-sm truncate text-foreground">
            {widgetTitle}
          </h3>
          <div className="flex items-center gap-1">
            {onPin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPin}
                className="h-6 w-6 p-0 hover:bg-accent"
                title="Pin to widget bar"
              >
                <Pin className="h-3 w-3" />
              </Button>
            )}
            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-6 w-6 p-0 hover:bg-accent"
                title="Maximize"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Widget Content */}
        <CardContent className="p-3 overflow-auto max-h-[calc(80vh-60px)]">
          {renderWidget()}
        </CardContent>
      </Card>
    </>
  );
};

export default WidgetFlyout;