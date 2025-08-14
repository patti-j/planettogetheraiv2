import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Pin, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onPin: () => void;
  onMaximize: () => void;
  widgetType: string;
  widgetTitle: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  anchorElement?: HTMLElement | null;
}

export function WidgetFlyout({
  isOpen,
  onClose,
  onPin,
  onMaximize,
  widgetType,
  widgetTitle,
  position = 'top-right',
  anchorElement
}: WidgetFlyoutProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 w-80 h-64 bg-background border rounded-lg shadow-lg",
        "transition-all duration-200 ease-in-out",
        position === 'top-right' && "top-16 right-4",
        position === 'top-left' && "top-16 left-4",
        position === 'bottom-right' && "bottom-4 right-4",
        position === 'bottom-left' && "bottom-4 left-4"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium">{widgetTitle}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPin}
            className="h-7 w-7 p-0"
          >
            <Pin className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMaximize}
            className="h-7 w-7 p-0"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-full">
        <div className="text-sm text-muted-foreground">
          Widget: {widgetType}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          This is a placeholder for the {widgetTitle} widget.
        </div>
      </div>
    </div>
  );
}