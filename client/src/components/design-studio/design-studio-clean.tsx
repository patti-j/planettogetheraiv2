import React from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { MobileDesignStudioNew } from './mobile-design-studio-new';
import AIDesignStudio from '@/components/ai-design-studio';
import WidgetDesignStudio from '@/components/widget-design-studio';
import { useToast } from '@/hooks/use-toast';

interface DesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignStudio({ open, onOpenChange }: DesignStudioProps) {
  const deviceType = useDeviceType();
  const { toast } = useToast();
  const [aiDesignStudioOpen, setAiDesignStudioOpen] = React.useState(false);
  const [widgetStudioOpen, setWidgetStudioOpen] = React.useState(false);
  const [selectedWidget, setSelectedWidget] = React.useState<any>(null);

  const handleEditWidget = (widget: any) => {
    setSelectedWidget(widget);
    setWidgetStudioOpen(true);
    toast({
      title: "Opening Widget Editor",
      description: `Editing ${widget.name}`,
    });
  };

  const handleCloneWidget = (widget: any) => {
    toast({
      title: "Widget Cloned",
      description: `Created copy of ${widget.name}`,
    });
    // TODO: Implement clone functionality
  };

  const handleEditDashboard = (dashboard: any) => {
    toast({
      title: "Opening Dashboard Editor",
      description: `Editing ${dashboard.name}`,
    });
    // TODO: Implement dashboard editing
  };

  const handleCloneDashboard = (dashboard: any) => {
    toast({
      title: "Dashboard Cloned",
      description: `Created copy of ${dashboard.name}`,
    });
    // TODO: Implement dashboard clone functionality
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div style={{ zIndex: 2147483649 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-2">
        <div className="w-full max-w-sm h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
          <MobileDesignStudioNew
            onClose={() => onOpenChange(false)}
            onAiAssistant={() => setAiDesignStudioOpen(true)}
            onEditWidget={handleEditWidget}
            onCloneWidget={handleCloneWidget}
            onEditDashboard={handleEditDashboard}
            onCloneDashboard={handleCloneDashboard}
          />
        </div>
      </div>

      {/* AI Design Studio */}
      <AIDesignStudio
        open={aiDesignStudioOpen}
        onOpenChange={setAiDesignStudioOpen}
      />

      {/* Widget Design Studio */}
      <WidgetDesignStudio
        open={widgetStudioOpen}
        onOpenChange={setWidgetStudioOpen}
        editingWidget={selectedWidget}
        onWidgetCreate={() => {
          setWidgetStudioOpen(false);
          setSelectedWidget(null);
        }}
      />
    </>
  );
}

export default DesignStudio;