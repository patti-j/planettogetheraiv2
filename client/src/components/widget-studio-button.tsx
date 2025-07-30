import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Sparkles } from 'lucide-react';
import WidgetDesignStudio from './widget-design-studio';
import { WidgetConfig } from '@/lib/widget-library';

interface WidgetStudioButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
  targetSystems?: string[];
  onWidgetCreate?: (widget: WidgetConfig, systems: string[]) => void;
}

export default function WidgetStudioButton({
  variant = "outline",
  size = "sm",
  children,
  className = "",
  targetSystems = [],
  onWidgetCreate
}: WidgetStudioButtonProps) {
  const [studioOpen, setStudioOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setStudioOpen(true)}
        className={`gap-2 ${className}`}
      >
        <Sparkles className="h-4 w-4" />
        {children || "Widget Studio"}
      </Button>

      <WidgetDesignStudio
        open={studioOpen}
        onOpenChange={setStudioOpen}
        onWidgetCreate={(widget, systems) => {
          console.log('Widget created from button:', widget, 'for systems:', systems);
          onWidgetCreate?.(widget, systems);
        }}
      />
    </>
  );
}