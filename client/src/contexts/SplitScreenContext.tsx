import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SplitMode = 'none' | 'horizontal' | 'vertical';
export type NavigationTarget = 'primary' | 'secondary';

interface SplitScreenContextType {
  splitMode: SplitMode;
  setSplitMode: (mode: SplitMode) => void;
  primaryPage: string;
  setPrimaryPage: (page: string) => void;
  secondaryPage: string;
  setSecondaryPage: (page: string) => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  navigationTarget: NavigationTarget;
  setNavigationTarget: (target: NavigationTarget) => void;
}

const SplitScreenContext = createContext<SplitScreenContextType | undefined>(undefined);

interface SplitScreenProviderProps {
  children: ReactNode;
}

export function SplitScreenProvider({ children }: SplitScreenProviderProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>('none');
  const [primaryPage, setPrimaryPage] = useState('/dashboard');
  const [secondaryPage, setSecondaryPage] = useState('/analytics');
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for first pane
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget>('primary');

  // Debug when split mode changes
  const setSplitModeWithDebug = (mode: SplitMode) => {
    console.log('🚨 SPLIT MODE CHANGE:', { from: splitMode, to: mode });
    console.trace('🚨 Split mode change stack trace');
    setSplitMode(mode);
  };


  return (
    <SplitScreenContext.Provider
      value={{
        splitMode,
        setSplitMode: setSplitModeWithDebug,
        primaryPage,
        setPrimaryPage,
        secondaryPage,
        setSecondaryPage,
        splitRatio,
        setSplitRatio,
        navigationTarget,
        setNavigationTarget,
      }}
    >
      {children}
    </SplitScreenContext.Provider>
  );
}

export function useSplitScreen() {
  const context = useContext(SplitScreenContext);
  if (context === undefined) {
    throw new Error('useSplitScreen must be used within a SplitScreenProvider');
  }
  return context;
}