import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type LayoutDensity = 'compressed' | 'standard' | 'comfortable';

interface LayoutDensityContextType {
  density: LayoutDensity;
  setDensity: (density: LayoutDensity) => void;
}

const LayoutDensityContext = createContext<LayoutDensityContextType | undefined>(undefined);

export const LayoutDensityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [density, setDensityState] = useState<LayoutDensity>('standard');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('layout-density') as LayoutDensity;
    if (saved && ['compressed', 'standard', 'comfortable'].includes(saved)) {
      setDensityState(saved);
    }
  }, []);

  // Apply CSS classes to document root
  useEffect(() => {
    document.documentElement.classList.remove('density-compressed', 'density-standard', 'density-comfortable');
    document.documentElement.classList.add(`density-${density}`);
  }, [density]);

  const setDensity = (newDensity: LayoutDensity) => {
    setDensityState(newDensity);
    localStorage.setItem('layout-density', newDensity);
  };

  return (
    <LayoutDensityContext.Provider value={{ density, setDensity }}>
      {children}
    </LayoutDensityContext.Provider>
  );
};

export const useLayoutDensity = () => {
  const context = useContext(LayoutDensityContext);
  if (context === undefined) {
    throw new Error('useLayoutDensity must be used within a LayoutDensityProvider');
  }
  return context;
};