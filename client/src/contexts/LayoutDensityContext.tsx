import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export type LayoutDensity = 'compact' | 'compressed' | 'standard' | 'comfortable';

interface LayoutDensityContextType {
  density: LayoutDensity;
  setDensity: (density: LayoutDensity) => void;
}

const LayoutDensityContext = createContext<LayoutDensityContextType | undefined>(undefined);

export const LayoutDensityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [density, setDensityState] = useState<LayoutDensity>('standard');

  // Load density from user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/user-preferences', user?.id],
    enabled: !!user?.id,
  });

  // Update density when preferences change
  useEffect(() => {
    if (preferences) {
      const prefDensity = (preferences as any)?.dashboardLayout?.uiDensity ?? 'standard';
      if (['compact', 'compressed', 'standard', 'comfortable'].includes(prefDensity)) {
        setDensityState(prefDensity);
      }
    }
  }, [preferences]);

  // Apply data-ui-density attribute to document root to work with existing CSS system
  useEffect(() => {
    document.documentElement.setAttribute('data-ui-density', density);
  }, [density]);

  const setDensity = (newDensity: LayoutDensity) => {
    setDensityState(newDensity);
    // Note: Actual saving is handled by CustomizableHeader through user preferences
    // This context is mainly for reading the current density state
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