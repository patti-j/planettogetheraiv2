import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetType: string;
  widgetTitle: string;
}

export function WidgetModal({
  isOpen,
  onClose,
  widgetType,
  widgetTitle
}: WidgetModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{widgetTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 min-h-[400px]">
          <div className="text-sm text-muted-foreground">
            Widget: {widgetType}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            This is a placeholder for the {widgetTitle} widget in modal view.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}