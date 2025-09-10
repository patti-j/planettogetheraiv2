import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface CanvasItem {
  id: string;
  type: 'dashboard' | 'chart' | 'table' | 'image' | 'interactive' | 'custom' | 'widget';
  title: string;
  content: any;
  width?: string;
  height?: string;
  position?: { x: number; y: number };
  timestamp?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
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
  messages: Message[];
  setMaxOpen: (open: boolean) => void;
  setMaxWidth: (width: number) => void;
  setMobileLayoutMode: (mode: 'split' | 'fullscreen') => void;
  setCurrentFullscreenView: (view: 'main' | 'max') => void;
  setCanvasVisible: (visible: boolean) => void;
  setCanvasHeight: (height: number) => void;
  setCanvasItems: (items: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => void;
  setCurrentPage: (page: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

const MaxDockContext = createContext<MaxDockContextType | undefined>(undefined);

export const MaxDockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize states with default values (database-only persistence)
  const [isMaxOpen, setIsMaxOpen] = useState(() => {
    // Open Max by default only on the specific production scheduler page, not scheduler-pro
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Only auto-open on /production-scheduler, explicitly closed on scheduler-pro
      return path === '/production-scheduler' && path !== '/scheduler-pro';
    }
    return false;
  });
  const [maxWidth, setMaxWidth] = useState(400);
  const [currentPage, setCurrentPage] = useState('/');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'split' | 'fullscreen'>('split');
  const [currentFullscreenView, setCurrentFullscreenView] = useState<'main' | 'max'>('max');
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]); // Canvas items state
  const [messages, setMessages] = useState<Message[]>([]); // Messages state

  // User preferences query - FIXED to prevent infinite loop
  const { data: userPreferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to reduce API calls
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: any) => 
      apiRequest('PATCH', `/api/user-preferences/${user?.id}`, preferences),
  });

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load user preferences - FIXED with safeguards to prevent infinite loop
  useEffect(() => {
    if (userPreferences && (userPreferences as any).maxAiState) {
      const maxState = (userPreferences as any).maxAiState;
      if (maxState.isOpen !== undefined) setIsMaxOpen(maxState.isOpen);
      if (maxState.width) setMaxWidth(maxState.width);
      if (maxState.currentPage) setCurrentPage(maxState.currentPage);
      if (maxState.mobileLayoutMode) setMobileLayoutMode(maxState.mobileLayoutMode);
      if (maxState.currentFullscreenView) setCurrentFullscreenView(maxState.currentFullscreenView);
      if (maxState.isCanvasVisible !== undefined) setIsCanvasVisible(maxState.isCanvasVisible);
      if (maxState.canvasHeight) setCanvasHeight(maxState.canvasHeight);
    }
  }, [userPreferences]);

  // Save state to database with throttling to prevent excessive calls
  const saveMaxState = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (updates: any) => {
      // Throttle saves to max once per 2 seconds to prevent infinite loops
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (user?.id) {
          const maxAiState = updates;
          updatePreferencesMutation.mutate({ maxAiState });
        }
      }, 2000);
    };
  }, [user?.id, updatePreferencesMutation]);

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

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
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
        messages,
        setMaxOpen,
        setMaxWidth: setMaxWidthValue,
        setMobileLayoutMode: setMobileLayoutModeValue,
        setCurrentFullscreenView: setCurrentFullscreenViewValue,
        setCanvasVisible: setCanvasVisibleValue,
        setCanvasHeight: setCanvasHeightValue,
        setCanvasItems,
        setCurrentPage: setCurrentPageValue,
        addMessage,
        clearMessages,
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