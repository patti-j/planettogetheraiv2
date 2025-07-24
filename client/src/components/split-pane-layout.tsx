import React, { useState, useRef, useEffect } from 'react';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, SplitSquareVertical } from 'lucide-react';
import { useAITheme } from '@/hooks/use-ai-theme';
import { MaxCanvas } from '@/components/max-canvas';

interface SplitPaneLayoutProps {
  children: React.ReactNode;
  maxPanel: React.ReactNode;
}

export function SplitPaneLayout({ children, maxPanel }: SplitPaneLayoutProps) {
  const { 
    isMaxOpen, 
    maxWidth, 
    isMobile, 
    mobileLayoutMode, 
    currentFullscreenView, 
    isCanvasVisible,
    canvasHeight,
    setMaxWidth, 
    setCurrentFullscreenView, 
    setMobileLayoutMode,
    setCanvasHeight
  } = useMaxDock();
  const { aiTheme } = useAITheme();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(300); // For mobile vertical split

  // Handle mouse/touch events for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent elements from handling this
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    if (isMobile) {
      // Mobile: vertical split (Max at bottom)
      const newHeight = rect.bottom - e.clientY;
      const minHeight = 60; // Allow minimizing to just header height
      const maxHeightLimit = rect.height * 0.7;
      setMaxHeight(Math.max(minHeight, Math.min(newHeight, maxHeightLimit)));
    } else {
      // Desktop: horizontal split (Max on left)
      const newWidth = e.clientX - rect.left;
      setMaxWidth(newWidth);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current || !e.touches[0]) return;
    
    // Prevent scrolling only when actively dragging the splitter
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    if (isMobile) {
      // Mobile: vertical split (Max at bottom)
      const newHeight = rect.bottom - touch.clientY;
      const minHeight = 60; // Allow minimizing to just header height
      const maxHeightLimit = rect.height * 0.7;
      setMaxHeight(Math.max(minHeight, Math.min(newHeight, maxHeightLimit)));
    } else {
      // Desktop: horizontal split (Max on left)  
      const newWidth = touch.clientX - rect.left;
      setMaxWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasResize = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = e.clientY - rect.top;
    const minHeight = 200;
    const maxHeightLimit = rect.height * 0.6;
    setCanvasHeight(Math.max(minHeight, Math.min(newHeight, maxHeightLimit)));
  };

  const handleCanvasResizeEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleCanvasResize);
    document.removeEventListener('mouseup', handleCanvasResizeEnd);
  };

  // Listen for header drag events from Max panel
  useEffect(() => {
    const handleHeaderDragStart = () => {
      setIsDragging(true);
    };

    window.addEventListener('max-header-drag-start', handleHeaderDragStart);
    
    return () => {
      window.removeEventListener('max-header-drag-start', handleHeaderDragStart);
    };
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isMobile, setMaxWidth]);

  if (!isMaxOpen) {
    // Max is closed, show only main content
    return <div className="w-full h-full">{children}</div>;
  }

  if (isMobile) {
    if (mobileLayoutMode === 'fullscreen') {
      // Mobile: fullscreen mode - show either main content or Max
      return (
        <div className="w-full h-full relative">
          {currentFullscreenView === 'main' ? children : maxPanel}
          
          {/* Floating controls for fullscreen mode */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {/* View switcher button */}
            <Button
              onClick={() => setCurrentFullscreenView(currentFullscreenView === 'main' ? 'max' : 'main')}
              className={`w-12 h-12 rounded-full ${aiTheme.gradient} shadow-lg border-2 border-white text-white`}
              title={`Switch to ${currentFullscreenView === 'main' ? 'Max AI' : 'Main Content'}`}
            >
              {currentFullscreenView === 'main' ? <Bot className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            </Button>
            
            {/* Back to split mode button */}
            <Button
              onClick={() => setMobileLayoutMode('split')}
              variant="outline"
              className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 shadow-lg border-2 border-gray-200"
              title="Switch to Split Mode"
            >
              <SplitSquareVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      );
    }
    
    // Mobile: vertical split with Max at bottom
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col">
        {/* Main content area - show either canvas or regular content */}
        <div 
          className="flex-1 overflow-hidden" 
          style={{ 
            height: `calc(100% - ${maxHeight}px - 4px)`,
            touchAction: 'pan-y pan-x' // Allow normal scrolling
          }}
        >
          {isCanvasVisible ? (
            <div className="h-full bg-gray-50 overflow-hidden">
              <MaxCanvas 
                isVisible={isCanvasVisible}
                onClose={() => {}}
                sessionId={`canvas_mobile_${Date.now()}`}
              />
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {children}
            </div>
          )}
        </div>
        
        {/* Resizer - Reverted to original thickness */}
        <div
          className="h-1 bg-gray-300 hover:bg-blue-400 cursor-row-resize transition-colors relative group"
          style={{ touchAction: 'none' }} // Prevent scrolling only on the resizer
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-0.5 bg-gray-500 group-hover:bg-blue-600 transition-colors"></div>
          </div>
        </div>
        
        {/* Max panel */}
        <div 
          className="bg-white border-t overflow-hidden" 
          style={{ height: `${maxHeight}px` }}
        >
          {maxPanel}
        </div>
      </div>
    );
  }

  // Desktop: horizontal split with Max on left
  return (
    <div ref={containerRef} className="w-full h-full flex">
      {/* Max panel */}
      <div 
        className="bg-white border-r overflow-hidden flex-shrink-0" 
        style={{ width: `${maxWidth}px` }}
      >
        {maxPanel}
      </div>
      
      {/* Resizer */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-500 group-hover:bg-blue-600 transition-colors"></div>
        </div>
      </div>
      
      {/* Main content area - show either canvas or regular content */}
      <div className="flex-1 overflow-hidden">
        {isCanvasVisible ? (
          <div className="h-full bg-gray-50 overflow-hidden">
            <MaxCanvas 
              isVisible={isCanvasVisible}
              onClose={() => {}}
              sessionId={`canvas_${Date.now()}`}
            />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}