import React, { useState } from 'react';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useLocation, Switch, Route } from 'wouter';
import { Button } from '@/components/ui/button';
import { X, GripVertical, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import your main pages for the split screen
import Dashboard from '@/pages/dashboard';
import Analytics from '@/pages/analytics';
import ScheduleManagement from '@/pages/schedule-management';
import ProductionPlanning from '@/pages/production-planning';
import CapacityPlanning from '@/pages/capacity-planning';
import MasterData from '@/pages/master-data';
import ControlTower from '@/pages/control-tower';

interface SplitScreenLayoutProps {
  children: React.ReactNode;
}

const availablePages = [
  { path: '/dashboard', label: 'Dashboard', component: Dashboard },
  { path: '/analytics', label: 'Analytics', component: Analytics },
  { path: '/schedule-management', label: 'Schedule Management', component: ScheduleManagement },
  { path: '/production-planning', label: 'Production Planning', component: ProductionPlanning },
  { path: '/capacity-planning', label: 'Capacity Planning', component: CapacityPlanning },
  { path: '/master-data', label: 'Master Data', component: MasterData },
  { path: '/control-tower', label: 'Global Control Tower', component: ControlTower },
];

function PageRenderer({ path }: { path: string }) {
  const page = availablePages.find(p => p.path === path);
  if (!page) {
    return <div className="p-4">Page not found: {path}</div>;
  }
  
  const PageComponent = page.component;
  return <PageComponent />;
}

export function SplitScreenLayout({ children }: SplitScreenLayoutProps) {
  const { splitMode, primaryPage, secondaryPage, setPrimaryPage, setSecondaryPage, splitRatio, setSplitRatio, navigationTarget, setNavigationTarget } = useSplitScreen();
  const [location] = useLocation();
  const [isDragging, setIsDragging] = useState(false);

  // Add event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Update target pane based on navigation target setting
  React.useEffect(() => {
    if (splitMode !== 'none') {
      if (navigationTarget === 'primary' && location !== primaryPage) {
        setPrimaryPage(location);
      } else if (navigationTarget === 'secondary' && location !== secondaryPage) {
        setSecondaryPage(location);
      }
    } else {
      // In single pane mode, always update the primary page
      if (location !== primaryPage) {
        setPrimaryPage(location);
      }
    }
  }, [location, splitMode, navigationTarget, primaryPage, secondaryPage, setPrimaryPage, setSecondaryPage]);

  // If not in split mode, just render children normally
  if (splitMode === 'none') {
    return <>{children}</>;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = (e.target as Element).closest('.split-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    if (splitMode === 'horizontal') {
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, newRatio)));
    } else {
      const newRatio = ((e.clientY - rect.top) / rect.height) * 100;
      setSplitRatio(Math.max(20, Math.min(80, newRatio)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={cn(
      "split-container h-full",
      splitMode === 'horizontal' ? "flex" : "flex flex-col"
    )}>
      {/* Primary pane */}
      <div 
        className="relative bg-background border-r border-border overflow-hidden cursor-pointer"
        style={{
          [splitMode === 'horizontal' ? 'width' : 'height']: `${splitRatio}%`
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Clicking primary pane CONTAINER, setting navigationTarget to primary', {
            currentTarget: navigationTarget,
            newTarget: 'primary'
          });
          setNavigationTarget('primary');
        }}
      >
        {/* Subtle border indicator for active navigation target */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
          navigationTarget === 'primary' ? 'ring-1 ring-blue-400/60 ring-inset' : ''
        }`} />
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>

      {/* Resizer */}
      <div
        className={cn(
          "bg-border hover:bg-accent cursor-grab active:cursor-grabbing transition-colors group relative",
          splitMode === 'horizontal' ? "w-1" : "h-1"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {splitMode === 'horizontal' ? (
            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <GripHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </div>

      {/* Secondary pane */}
      <div 
        className="relative bg-background overflow-hidden cursor-pointer"
        style={{
          [splitMode === 'horizontal' ? 'width' : 'height']: `${100 - splitRatio}%`
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Clicking secondary pane CONTAINER, setting navigationTarget to secondary', {
            currentTarget: navigationTarget,
            newTarget: 'secondary'
          });
          setNavigationTarget('secondary');
        }}
      >
        {/* Subtle border indicator for active navigation target */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
          navigationTarget === 'secondary' ? 'ring-1 ring-blue-400/60 ring-inset' : ''
        }`} />
        
        {/* Clean page selector that appears on hover */}
        <div className="absolute top-2 right-2 z-10 opacity-0 hover:opacity-100 transition-opacity">
          <select
            value={secondaryPage}
            onChange={(e) => setSecondaryPage(e.target.value)}
            className="bg-background/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {availablePages.map(page => (
              <option key={page.path} value={page.path}>
                {page.label}
              </option>
            ))}
          </select>
        </div>
        <div className="h-full overflow-auto">
          <PageRenderer path={secondaryPage} />
        </div>
      </div>
    </div>
  );
}