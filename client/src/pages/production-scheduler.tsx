import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useTheme } from '@/hooks/useThemeFederated';

/**
 * Production Schedule Page - Integrated Bryntum Scheduler Pro
 * This component embeds the standalone HTML scheduler via iframe,
 * providing full Bryntum functionality with PT data integration.
 * Optimized for mobile and tablet devices.
 */
export default function ProductionScheduler() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { resolvedTheme, theme } = useTheme();

  // Use resolved theme (light/dark) instead of raw theme (light/dark/system)
  // Initialize with theme from localStorage or default
  const [iframeUrl, setIframeUrl] = useState(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    return `/api/production-scheduler?v=${Date.now()}&theme=${savedTheme}&cb=1760634200`;
  });

  useEffect(() => {
    // Set page title
    document.title = 'Production Schedule - PlanetTogether';
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Handle iframe load event
    const handleLoad = () => {
      setIsLoading(false);
      console.log('✅ Production scheduler loaded successfully');
      
      // Also send theme via postMessage as backup
      console.log('📤 [Parent] Sending theme to scheduler iframe:', resolvedTheme);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'SET_THEME',
          theme: resolvedTheme
        }, '*');
      }, 100); // Small delay to ensure iframe is ready
      
      // Ensure iframe is touch-friendly on mobile
      if (iframeRef.current && isMobile) {
        iframeRef.current.style.touchAction = 'pan-x pan-y';
      }
    };

    // Listen for theme changes in parent and forward to iframe
    const handleThemeChange = (e: CustomEvent) => {
      // Note: When theme changes, the resolvedTheme will automatically update via useTheme hook
      // So we'll handle it in a separate useEffect
    };

    // Listen for Max AI actions (refresh_scheduler)
    const handleMaxAIAction = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      
      if (type === 'refresh_scheduler') {
        console.log('[Production Scheduler] Received refresh request from Max AI:', data);
        
        // Reload the scheduler iframe with cache busting
        if (iframeRef.current) {
          setIsLoading(true);
          iframeRef.current.src = `/api/production-scheduler?v=${Date.now()}&cb=1760634200`;
        }
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
      
      // Handle potential errors
      iframe.addEventListener('error', () => {
        console.error('❌ Failed to load production scheduler');
        setIsLoading(false);
      });
    }

    // Listen for Max AI actions and theme changes
    window.addEventListener('maxai:action' as any, handleMaxAIAction as any);
    window.addEventListener('themechange' as any, handleThemeChange as any);

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('maxai:action' as any, handleMaxAIAction as any);
      window.removeEventListener('themechange' as any, handleThemeChange as any);
    };
  }, [isMobile, resolvedTheme]);
  
  // Update iframe when resolved theme changes
  useEffect(() => {
    if (resolvedTheme && iframeRef.current) {
      console.log('📤 [Parent] Theme changed to:', resolvedTheme, '(raw theme:', theme, ')');
      // Update iframe URL with new theme
      setIframeUrl(`/api/production-scheduler?v=${Date.now()}&theme=${resolvedTheme}&cb=1760634200`);
      // Also send via postMessage for instant update
      setTimeout(() => {
        if (iframeRef.current?.contentWindow) {
          console.log('📤 [Parent] Sending theme via postMessage:', resolvedTheme);
          iframeRef.current.contentWindow.postMessage({
            type: 'SET_THEME',
            theme: resolvedTheme
          }, '*');
        }
      }, 100); // Small delay to ensure iframe is ready
    }
  }, [resolvedTheme, theme]);

  return (
    <div className="h-full flex flex-col">
      {/* Main Content - Uses available height instead of h-screen */}
      <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <Card className={`p-6 flex flex-col items-center gap-4 shadow-lg ${isMobile ? 'mx-4' : ''}`}>
              <Loader2 className={`animate-spin text-blue-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              <div className="text-center">
                <p className={`font-semibold text-gray-900 dark:text-gray-100 ${isMobile ? 'text-sm' : ''}`}>
                  Loading Production Scheduler
                </p>
                <p className={`text-gray-500 dark:text-gray-400 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Initializing Bryntum components...
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Scheduler iframe with cache busting - optimized for mobile */}
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          title="Production Scheduler"
          data-testid="production-scheduler-iframe"
          style={{
            display: isLoading ? 'none' : 'block',
            backgroundColor: 'white',
            // Ensure iframe is scrollable on mobile
            WebkitOverflowScrolling: 'touch' as any,
            overflow: 'auto',
          }}
          // Allow fullscreen for better mobile experience
          allowFullScreen
        />
      </div>
    </div>
  );
}