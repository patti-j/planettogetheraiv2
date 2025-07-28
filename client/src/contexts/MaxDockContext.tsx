import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface CanvasItem {
  id: string;
  type: 'dashboard' | 'chart' | 'table' | 'image' | 'interactive' | 'custom';
  title: string;
  content: any;
  width?: string;
  height?: string;
  position?: { x: number; y: number };
  timestamp?: string;
}

interface MaxDockContextType {
  isMaxOpen: boolean;
  maxWidth: number;
  isMobile: boolean;
  mobileLayoutMode: 'split' | 'fullscreen';
  currentFullscreenView: 'main' | 'max';
  isCanvasVisible: boolean;
  canvasHeight: number;
  canvasItems: CanvasItem[];
  currentPage: string;
  setMaxOpen: (open: boolean) => void;
  setMaxWidth: (width: number) => void;
  setMobileLayoutMode: (mode: 'split' | 'fullscreen') => void;
  setCurrentFullscreenView: (view: 'main' | 'max') => void;
  setCanvasVisible: (visible: boolean) => void;
  setCanvasHeight: (height: number) => void;
  setCanvasItems: (items: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => void;
  setCurrentPage: (page: string) => void;
}

const MaxDockContext = createContext<MaxDockContextType | undefined>(undefined);

export const MaxDockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize states with default values (database-only persistence)
  const [isMaxOpen, setIsMaxOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(400);
  const [currentPage, setCurrentPage] = useState('/');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'split' | 'fullscreen'>('split');
  const [currentFullscreenView, setCurrentFullscreenView] = useState<'main' | 'max'>('max');
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]); // Canvas items state

  // TEMPORARILY DISABLED - User preferences query to break infinite loop
  const userPreferences = null; // Disabled to break infinite loop

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: any) => 
      apiRequest('PATCH', `/api/user-preferences/${user?.id}`, preferences),
  });

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // TEMPORARILY DISABLED - Load user preferences to break infinite loop
  useEffect(() => {
    console.log('MaxDockContext preferences loading disabled to break infinite loop');
    // Temporarily disabled to break infinite loop
  }, [userPreferences]);

  // TEMPORARILY DISABLED - Save state to database to break infinite loop
  const saveMaxState = (updates: any) => {
    // Temporarily disabled to break infinite loop
    console.log('MaxDockContext saveMaxState disabled to break infinite loop:', updates);
  };

  const setMaxOpen = (open: boolean) => {
    setIsMaxOpen(open);
    saveMaxState({ isOpen: open });
  };

  const setMaxWidthValue = (width: number) => {
    const newWidth = Math.max(200, Math.min(width, window.innerWidth * 0.8));
    setMaxWidth(newWidth);
    saveMaxState({ width: newWidth });
  };

  const setCanvasHeightValue = (height: number) => {
    const newHeight = Math.max(200, Math.min(height, window.innerHeight * 0.6));
    setCanvasHeight(newHeight);
    saveMaxState({ canvasHeight: newHeight });
  };

  const setCurrentPageValue = (page: string) => {
    setCurrentPage(page);
    saveMaxState({ currentPage: page });
  };

  const setMobileLayoutModeValue = (mode: 'split' | 'fullscreen') => {
    setMobileLayoutMode(mode);
    saveMaxState({ mobileLayoutMode: mode });
  };

  const setCurrentFullscreenViewValue = (view: 'main' | 'max') => {
    setCurrentFullscreenView(view);
    saveMaxState({ currentFullscreenView: view });
  };

  const setCanvasVisibleValue = (visible: boolean) => {
    setIsCanvasVisible(visible);
    saveMaxState({ isCanvasVisible: visible });
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
        canvasItems,
        currentPage,
        setMaxOpen,
        setMaxWidth: setMaxWidthValue,
        setMobileLayoutMode: setMobileLayoutModeValue,
        setCurrentFullscreenView: setCurrentFullscreenViewValue,
        setCanvasVisible: setCanvasVisibleValue,
        setCanvasHeight: setCanvasHeightValue,
        setCanvasItems,
        setCurrentPage: setCurrentPageValue,
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