import React from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("h-full overflow-auto", className)}>
      {children}
    </div>
  );
};

export default WorkspaceLayout;