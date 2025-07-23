import React, { useState, useRef, useEffect } from 'react';
import { useMaxDock } from '@/contexts/MaxDockContext';

interface SplitPaneLayoutProps {
  children: React.ReactNode;
  maxPanel: React.ReactNode;
}

export function SplitPaneLayout({ children, maxPanel }: SplitPaneLayoutProps) {
  const { isMaxOpen, maxWidth, isMobile, setMaxWidth } = useMaxDock();
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
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    if (isMobile) {
      // Mobile: vertical split (Max at bottom)
      const newHeight = rect.bottom - e.clientY;
      const minHeight = 200;
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

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    if (isMobile) {
      // Mobile: vertical split (Max at bottom)
      const newHeight = rect.bottom - touch.clientY;
      const minHeight = 200;
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

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
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
    // Mobile: vertical split with Max at bottom
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col">
        {/* Main content area */}
        <div 
          className="flex-1 overflow-hidden" 
          style={{ height: `calc(100% - ${maxHeight}px - 4px)` }}
        >
          {children}
        </div>
        
        {/* Resizer */}
        <div
          className="h-1 bg-gray-300 hover:bg-blue-400 cursor-row-resize transition-colors relative group"
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
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}