import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MaxDockContextType {
  isDocked: boolean;
  dockPosition: 'left' | 'right' | 'top' | 'bottom' | null;
  dockWidth: number;
  dockHeight: number;
  setDockState: (isDocked: boolean, position: 'left' | 'right' | 'top' | 'bottom' | null, width?: number, height?: number) => void;
}

const MaxDockContext = createContext<MaxDockContextType | undefined>(undefined);

export const MaxDockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDocked, setIsDocked] = useState(false);
  const [dockPosition, setDockPosition] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const [dockWidth, setDockWidth] = useState(400);
  const [dockHeight, setDockHeight] = useState(300);

  const setDockState = (
    docked: boolean,
    position: 'left' | 'right' | 'top' | 'bottom' | null,
    width: number = 400,
    height: number = 300
  ) => {
    setIsDocked(docked);
    setDockPosition(position);
    setDockWidth(width);
    setDockHeight(height);
  };

  return (
    <MaxDockContext.Provider
      value={{
        isDocked,
        dockPosition,
        dockWidth,
        dockHeight,
        setDockState,
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