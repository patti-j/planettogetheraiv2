import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface MaxDockContextType {
  isMaxOpen: boolean;
  maxWidth: number;
  isMobile: boolean;
  mobileLayoutMode: 'split' | 'fullscreen';
  currentFullscreenView: 'main' | 'max';
  isCanvasVisible: boolean;
  canvasHeight: number;
  setMaxOpen: (open: boolean) => void;
  setMaxWidth: (width: number) => void;
  setMobileLayoutMode: (mode: 'split' | 'fullscreen') => void;
  setCurrentFullscreenView: (view: 'main' | 'max') => void;
  setCanvasVisible: (visible: boolean) => void;
  setCanvasHeight: (height: number) => void;
}

const MaxDockContext = createContext<MaxDockContextType | undefined>(undefined);

export const MaxDockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMaxOpen, setIsMaxOpen] = useState(true); // Default to visible
  const [maxWidth, setMaxWidth] = useState(400); // Default width for desktop sidebar
  const [isMobile, setIsMobile] = useState(false);
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'split' | 'fullscreen'>('split');
  const [currentFullscreenView, setCurrentFullscreenView] = useState<'main' | 'max'>('max');
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(300); // Default canvas height

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const setMaxOpen = (open: boolean) => {
    setIsMaxOpen(open);
  };

  const setMaxWidthValue = (width: number) => {
    setMaxWidth(Math.max(200, Math.min(width, window.innerWidth * 0.8)));
  };

  const setCanvasHeightValue = (height: number) => {
    setCanvasHeight(Math.max(200, Math.min(height, window.innerHeight * 0.6)));
  };

  return (
    <MaxDockContext.Provider
      value={{
        isMaxOpen,
        maxWidth,
        isMobile,
        mobileLayoutMode,
        currentFullscreenView,
        isCanvasVisible,
        canvasHeight,
        setMaxOpen,
        setMaxWidth: setMaxWidthValue,
        setMobileLayoutMode,
        setCurrentFullscreenView,
        setCanvasVisible: setIsCanvasVisible,
        setCanvasHeight: setCanvasHeightValue,
      }}
    >
      {children}
    </MaxDockContext.Provider>
  );
};

export const useMaxDock = () => {
  const context = useContext(MaxDockContext);
  if (context === undefined) {
    throw new Error('useMaxDock must be used within a MaxDockProvider');
  }
  return context;
};