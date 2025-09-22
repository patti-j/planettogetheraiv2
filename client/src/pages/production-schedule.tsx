import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SchedulingAgent } from '@/components/ai-consultant/SchedulingAgent';

/**
 * Production Schedule Page - Integrated Bryntum Scheduler Pro
 * This component embeds the standalone HTML scheduler via iframe,
 * providing full Bryntum functionality with PT data integration.
 */
export default function ProductionSchedule() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Production Schedule - PlanetTogether';

    // Handle iframe load event
    const handleLoad = () => {
      setIsLoading(false);
      console.log('✅ Production scheduler loaded successfully');
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

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main Content - Full Screen */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <Card className="p-6 flex flex-col items-center gap-4 shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Loading Production Scheduler
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Initializing Bryntum components...
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Scheduler iframe with cache busting */}
        <iframe
          ref={iframeRef}
          src={`/api/scheduler-demo?v=${Date.now()}`}
          className="w-full h-full border-0"
          title="Production Scheduler"
          data-testid="production-scheduler-iframe"
          style={{
            display: isLoading ? 'none' : 'block',
            backgroundColor: 'white',
          }}
        />
      </div>

      {/* AI Scheduling Agent */}
      <SchedulingAgent />
    </div>
  );
}