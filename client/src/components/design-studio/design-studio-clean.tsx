import React from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { MobileDesignStudioNew } from './mobile-design-studio-new';
import AIDesignStudio from '@/components/ai-design-studio';

interface DesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignStudio({ open, onOpenChange }: DesignStudioProps) {
  const { isMobile } = useDeviceType();
  const [aiDesignStudioOpen, setAiDesignStudioOpen] = React.useState(false);

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
          />
        </div>
      </div>

      {/* AI Design Studio */}
      <AIDesignStudio
        open={aiDesignStudioOpen}
        onOpenChange={setAiDesignStudioOpen}
      />
    </>
  );
}

export default DesignStudio;