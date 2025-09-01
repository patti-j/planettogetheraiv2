import { useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "wouter";

type ViewMode = "mobile" | "desktop" | "auto";

interface ViewModeContextType {
  viewMode: ViewMode;
  currentView: "mobile" | "desktop";
  setViewMode: (mode: ViewMode) => void;
  toggleView: () => void;
  isForced: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("auto");
  const [isMobile, setIsMobile] = useState(false);
  const [, setLocation] = useLocation();
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("viewMode") as ViewMode;
    if (saved && ["mobile", "desktop", "auto"].includes(saved)) {
      setViewModeState(saved);
    }
  }, []);

  // Determine current view based on mode and device
  const currentView: "mobile" | "desktop" = 
    viewMode === "auto" ? (isMobile ? "mobile" : "desktop") :
    viewMode === "mobile" ? "mobile" : "desktop";

  const isForced = viewMode !== "auto";

  const setViewMode = (mode: ViewMode) => {
    console.log("🎯 Setting view mode to:", mode);
    setViewModeState(mode);
    localStorage.setItem("viewMode", mode);
    
    // Apply CSS class to body for desktop override
    if (mode === "desktop") {
      console.log("💻 Adding force-desktop-view class");
      document.body.classList.add("force-desktop-view");
      document.body.classList.remove("force-mobile-view");
      document.documentElement.classList.add("force-desktop-view");
      document.documentElement.classList.remove("force-mobile-view");
    } else if (mode === "mobile") {
      console.log("📱 Adding force-mobile-view class");
      document.body.classList.add("force-mobile-view");
      document.body.classList.remove("force-desktop-view");
      document.documentElement.classList.add("force-mobile-view");
      document.documentElement.classList.remove("force-desktop-view");
    } else {
      console.log("🔄 Removing forced view classes");
      document.body.classList.remove("force-desktop-view", "force-mobile-view");
      document.documentElement.classList.remove("force-desktop-view", "force-mobile-view");
    }
  };

  const toggleView = () => {
    console.log("🔄 Toggle clicked - Current view:", currentView, "Current mode:", viewMode);
    if (currentView === "mobile") {
      console.log("🖥️ Switching to desktop view");
      setViewMode("desktop");
      // Navigate to desktop homepage when switching from mobile to desktop
      setLocation("/");
    } else {
      console.log("📱 Switching to mobile view");  
      setViewMode("mobile");
      // Navigate to mobile home when switching from desktop to mobile
      setLocation("/mobile-home");
    }
  };

  // Apply initial classes
  useEffect(() => {
    if (viewMode === "desktop") {
      document.body.classList.add("force-desktop-view");
    } else if (viewMode === "mobile") {
      document.body.classList.add("force-mobile-view");
    }
  }, []);

  return (
    <ViewModeContext.Provider value={{
      viewMode,
      currentView,
      setViewMode,
      toggleView,
      isForced
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}