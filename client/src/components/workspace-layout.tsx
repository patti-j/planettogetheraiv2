import React from 'react';
import { cn } from '@/lib/utils';
import WidgetBar from './widget-bar';
import WidgetBarToggle from './widget-bar-toggle';
import { useWidgetBar } from '@/contexts/WidgetBarContext';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children, className }) => {
  const { settings, updatePosition, toggleCollapse, toggleVisibility, updateWidgets } = useWidgetBar();

  if (!settings.isVisible) {
    return (
      <div className={className}>
        {children}
        <WidgetBarToggle />
      </div>
    );
  }

  const renderLayout = () => {
    const { position, isCollapsed } = settings;

    switch (position) {
      case 'top':
        return (
          <div className="h-full flex flex-col">
            <WidgetBar
              position="top"
              isCollapsed={isCollapsed}
              onPositionChange={updatePosition}
              onToggleCollapse={toggleCollapse}
              onClose={toggleVisibility}
              widgets={settings.widgets}
              onWidgetUpdate={updateWidgets}
            />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        );

      case 'bottom':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
            <WidgetBar
              position="bottom"
              isCollapsed={isCollapsed}
              onPositionChange={updatePosition}
              onToggleCollapse={toggleCollapse}
              onClose={toggleVisibility}
              widgets={settings.widgets}
              onWidgetUpdate={updateWidgets}
            />
          </div>
        );

      case 'left':
        return (
          <div className="h-full flex">
            <WidgetBar
              position="left"
              isCollapsed={isCollapsed}
              onPositionChange={updatePosition}
              onToggleCollapse={toggleCollapse}
              onClose={toggleVisibility}
              widgets={settings.widgets}
              onWidgetUpdate={updateWidgets}
            />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        );

      case 'right':
        return (
          <div className="h-full flex">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
            <WidgetBar
              position="right"
              isCollapsed={isCollapsed}
              onPositionChange={updatePosition}
              onToggleCollapse={toggleCollapse}
              onClose={toggleVisibility}
              widgets={settings.widgets}
              onWidgetUpdate={updateWidgets}
            />
          </div>
        );

      default:
        return <div className={className}>{children}</div>;
    }
  };

  return (
    <div className={cn("h-full", className)}>
      {renderLayout()}
    </div>
  );
};

export default WorkspaceLayout;