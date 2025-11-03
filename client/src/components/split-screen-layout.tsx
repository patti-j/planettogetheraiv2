import React, { useState } from 'react';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useLocation, Switch, Route } from 'wouter';
import { Button } from '@/components/ui/button';
import { X, GripVertical, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DesktopLayout } from '@/components/navigation/desktop-layout';

// Dynamic page rendering - no need to import every page

interface SplitScreenLayoutProps {
  children: React.ReactNode;
}

function PageRenderer({ path }: { path: string }) {
  const [PageComponent, setPageComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadComponent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Dynamic import based on path - this automatically works with any page that exists
        const pathWithoutSlash = path.replace(/^\//, '');
        const componentPath = pathWithoutSlash || 'dashboard';
        
        // Convert kebab-case to PascalCase for component names
        const componentName = componentPath
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');
        
        // Try to dynamically import the component
        let component;
        try {
          // First try the pages directory
          const module = await import(`../pages/${pathWithoutSlash}.tsx`);
          component = module.default;
        } catch (err) {
          // If not found in pages, try common alternative paths
          try {
            const module = await import(`../pages/${componentPath}/${componentPath}.tsx`);
            component = module.default;
          } catch (err2) {
            // If still not found, try with different naming convention
            try {
              const module = await import(`../pages/${componentName}.tsx`);
              component = module.default;
            } catch (err3) {
              throw new Error(`Component not found for path: ${path}`);
            }
          }
        }
        
        setPageComponent(() => component);
      } catch (err) {
        console.warn(`Failed to load component for path ${path}:`, err);
        setError(`Page not available: ${path}`);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !PageComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{error || `Page not found: ${path}`}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <PageComponent />
    </div>
  );
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

  // Handle navigation - update primary page in single pane mode
  React.useEffect(() => {
    if (splitMode === 'none') {
      // Single pane mode - always update primary
      if (location !== primaryPage) {
        setPrimaryPage(location);
      }
    }
  }, [location, splitMode, primaryPage, setPrimaryPage]);

  // If not in split mode, wrap in DesktopLayout to preserve menu and panels
  if (splitMode === 'none') {
    return <DesktopLayout>{children}</DesktopLayout>;
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
        className="relative bg-background border-r border-border overflow-hidden"
        style={{
          [splitMode === 'horizontal' ? 'width' : 'height']: `${splitRatio}%`
        }}
      >
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
        className="relative bg-background overflow-hidden"
        style={{
          [splitMode === 'horizontal' ? 'width' : 'height']: `${100 - splitRatio}%`
        }}
      >
        {/* Page information indicator */}
        {secondaryPage && (
          <div className="absolute top-2 right-2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs shadow-sm">
            {secondaryPage}
          </div>
        )}
        <div className="h-full overflow-auto">
          <PageRenderer path={secondaryPage} />
        </div>
      </div>

    </div>
  );
}