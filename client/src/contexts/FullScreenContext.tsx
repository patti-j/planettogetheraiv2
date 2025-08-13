import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FullScreenContextType {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  setFullScreen: (fullScreen: boolean) => void;
}

const FullScreenContext = createContext<FullScreenContextType | undefined>(undefined);

export const FullScreenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  const setFullScreen = (fullScreen: boolean) => {
    setIsFullScreen(fullScreen);
  };

  return (
    <FullScreenContext.Provider
      value={{
        isFullScreen,
        toggleFullScreen,
        setFullScreen,
      }}
    >
      {children}
    </FullScreenContext.Provider>
  );
};

export const useFullScreen = () => {
  const context = useContext(FullScreenContext);
  if (context === undefined) {
    throw new Error('useFullScreen must be used within a FullScreenProvider');
  }
  return context;
};