import React from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { AiDesignStudioMobile } from './ai-design-studio-mobile';
import AIDesignStudio from '@/components/ai-design-studio';

interface DesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignStudio({ open, onOpenChange }: DesignStudioProps) {
  const deviceType = useDeviceType();
  const [aiDesignStudioOpen, setAiDesignStudioOpen] = React.useState(false);

  if (!open) {
    return null;
  }

  return (
    <>
      <div style={{ zIndex: 9999 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-2">
        <div className="w-full max-w-sm h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
          <AiDesignStudioMobile
            onClose={() => onOpenChange(false)}
            onAiAssistant={() => setAiDesignStudioOpen(true)}
            showDesignStudio={true}
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