import { useEffect, useRef, useState } from 'react';

export default function ProductionSchedulerWrapper() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle iframe load event
    const handleIframeLoad = () => {
      setIsLoading(false);
      
      // Try to communicate with the iframe to sync theme
      if (iframeRef.current) {
        try {
          const theme = localStorage.getItem('theme') || 'light';
          iframeRef.current.contentWindow?.postMessage(
            { type: 'SET_THEME', theme },
            window.location.origin
          );
        } catch (error) {
          console.log('Could not communicate with iframe:', error);
        }
      }
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, []);

  // Listen for theme changes in the parent app
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && iframeRef.current) {
        try {
          iframeRef.current.contentWindow?.postMessage(
            { type: 'SET_THEME', theme: e.newValue || 'light' },
            window.location.origin
          );
        } catch (error) {
          console.log('Could not communicate with iframe:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="h-full w-full relative bg-background">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading Production Scheduler...</p>
          </div>
        </div>
      )}
      
      {/* Iframe container */}
      <iframe
        ref={iframeRef}
        src="/production-scheduler-integrated.html"
        className="w-full h-full border-0"
        title="Production Scheduler"
        allow="fullscreen"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}