import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface MaxDockContextType {
  isMaxOpen: boolean;
  maxWidth: number;
  isMobile: boolean;
  setMaxOpen: (open: boolean) => void;
  setMaxWidth: (width: number) => void;
}

const MaxDockContext = createContext<MaxDockContextType | undefined>(undefined);

export const MaxDockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMaxOpen, setIsMaxOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(400); // Default width for desktop sidebar
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <MaxDockContext.Provider
      value={{
        isMaxOpen,
        maxWidth,
        isMobile,
        setMaxOpen,
        setMaxWidth: setMaxWidthValue,
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