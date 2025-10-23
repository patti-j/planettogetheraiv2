import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { loadPowerBIScript, createPowerBIConfig, isMobileLike, type PowerBIReport } from "@/lib/powerbi-config";
import { type ReportEmbedConfig, type PowerBIReport as ReportData, type ReportFilters } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

// Types for refresh tracking
type RefreshStatus = 'idle' | 'refreshing' | 'completed' | 'failed' | 'cancelling' | 'cancelled';
type RefreshInfo = {
  status: RefreshStatus;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  refreshId?: string;
  error?: string;
  estimation?: {
    estimateRangeSeconds: {
      min: number;
      max: number;
      median: number;
    };
    confidenceLevel: "low" | "medium" | "high";
    historicalDataPoints: number;
    averageDurationSeconds: number;
    contextualFactors: {
      storageMode: string;
      isLargeDataset?: boolean;
      isPeakHour?: boolean;
      recentFailures?: boolean;
    };
    message: string;
  };
  progressPercentage?: number; // calculated based on elapsed vs estimated time
  contextualMessage?: string; // dynamic message based on progress
};

// Simple embed function - no complex authentication
export function useSimplePowerBIEmbed() {
  const embedMutation = useMutation({
    mutationFn: async ({ accessToken, workspaceId, reportId }: { 
      accessToken: string; 
      workspaceId: string; 
      reportId: string; 
    }) => {
      const response = await apiRequest("POST", "/api/embed", { 
        accessToken, 
        workspaceId, 
        reportId 
      });
      return response.json() as Promise<ReportEmbedConfig>;
    },
  });

  return {
    embedReport: embedMutation.mutateAsync,
    isLoading: embedMutation.isPending,
    error: embedMutation.error,
  };
}

// Simplified - no need for complex report management
export function useReports() {
  return {
    reports: [],
    isLoading: false,
    error: null,
  };
}

export function useReportParameters(reportId: string) {
  const { data: parameters = [], isLoading } = useQuery({
    queryKey: ["/api/reports", reportId, "parameters"],
    enabled: !!reportId,
  });

  return {
    parameters,
    isLoading,
  };
}

// Removed JavaScript scaling functions - they interfere with proper mobile layout

export function usePowerBIEmbed(containerId: string = "reportContainer") {
  // All useState hooks first (in order)
  const [report, setReport] = useState<PowerBIReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aadToken, setAADToken] = useState<string | null>(null);
  const [embedTokenExpiration, setEmbedTokenExpiration] = useState<string | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [currentEmbedConfig, setCurrentEmbedConfig] = useState<ReportEmbedConfig | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [currentAccessLevel, setCurrentAccessLevel] = useState<"View" | "Edit">("View");
  const [pages, setPages] = useState<Array<{id: string, displayName: string, isActive: boolean}>>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [refreshInfo, setRefreshInfo] = useState<RefreshInfo>({
    status: 'idle',
    startTime: null,
    elapsedTime: 0
  });
  const [refreshIntervalTimer, setRefreshIntervalTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState<boolean>(false);
  
  // All useRef hooks second
  const currentAccessLevelRef = useRef<"View" | "Edit">("View");
  const currentEmbedConfigRef = useRef<ReportEmbedConfig | null>(null);
  const refreshEmbedTokenRef = useRef<(cfg: ReportEmbedConfig) => Promise<void>>(async () => {});
  const isFullscreenRef = useRef<boolean>(false);
  
  // Polling query for refresh status with timeout handling
  // Fixed: Always enable query but handle conditional logic inside queryFn to prevent hook order violations
  const { data: refreshHistory } = useQuery({
    queryKey: ['/api/powerbi/workspaces', currentEmbedConfig?.workspaceId, 'datasets', currentEmbedConfig?.datasetId, 'refreshes'],
    queryFn: async () => {
      // Always return empty if not refreshing or missing config
      if (refreshInfo.status !== 'refreshing' || !currentEmbedConfig?.workspaceId || !currentEmbedConfig?.datasetId) {
        return { refreshes: [] };
      }
      
      // Add timeout check - stop polling after 10 minutes
      if (refreshInfo.startTime) {
        const elapsed = (Date.now() - refreshInfo.startTime.getTime()) / 1000;
        if (elapsed > 600) { // 10 minutes
          console.warn('⏰ Refresh polling timeout reached (10 minutes), stopping polling');
          setRefreshInfo(prev => ({
            ...prev,
            status: 'failed',
            error: 'Refresh timeout - operation took longer than 10 minutes'
          }));
          return { refreshes: [] };
        }
      }
      
      console.log('📊 Polling refresh status...', {
        workspaceId: currentEmbedConfig.workspaceId,
        datasetId: currentEmbedConfig.datasetId,
        refreshId: refreshInfo.refreshId,
        elapsedTime: refreshInfo.elapsedTime
      });
      
      const response = await fetch(`/api/powerbi/workspaces/${currentEmbedConfig.workspaceId}/datasets/${currentEmbedConfig.datasetId}/refreshes`);
      if (!response.ok) {
        throw new Error('Failed to fetch refresh status');
      }
      const result = await response.json();
      
      console.log('📊 Refresh status response received:', {
        totalRefreshes: result?.refreshes?.length || 0,
        latestStatus: result?.refreshes?.[0]?.status || 'no refreshes'
      });
      
      return result;
    },
    enabled: true, // Always enabled to prevent hook order changes
    refetchInterval: 4000, // Always poll every 4 seconds (queryFn handles the conditional logic)
    refetchIntervalInBackground: true,
  });
  
  // Removed custom action bar state - using native Power BI navigation

  // Helper function to decode JWT and get expiration
  const getTokenExpiration = useCallback((token: string): Date | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch {
      return null;
    }
  }, []);

  // Function to refresh embed token using the stored AAD token
  const refreshEmbedToken = useCallback(async (config: ReportEmbedConfig) => {
    if (!aadToken || !report) {
      console.warn("Cannot refresh token: missing AAD token or report");
      return;
    }

    try {
      console.log("Refreshing embed token...");
      
      // Get new embed config with current access level
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(aadToken !== "server-side-auth" && { accessToken: aadToken }), // Only include if not server-side
          workspaceId: config.workspaceId,
          reportId: config.reportId,
          accessLevel: currentAccessLevel, // Preserve current access level on refresh
          allowSaveAs: currentAccessLevel === "Edit"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh embed token');
      }

      const newEmbedConfig = await response.json();
      
      // Update the report with new token (method exists in Power BI SDK but not in TypeScript definitions)
      await (report as any).setAccessToken(newEmbedConfig.accessToken);
      
      // Update state and refs
      setEmbedTokenExpiration(newEmbedConfig.expiration);
      setCurrentEmbedConfig(newEmbedConfig);
      currentEmbedConfigRef.current = newEmbedConfig;
      
      // Set up next refresh timer
      if (newEmbedConfig.expiration) {
        startRefreshTimer(newEmbedConfig.expiration, newEmbedConfig);
      }
      
      console.log("✅ Embed token refreshed successfully");
    } catch (err) {
      console.error("❌ Failed to refresh embed token:", err);
      
      // Check if AAD token has expired
      if (aadToken) {
        const aadExpiration = getTokenExpiration(aadToken);
        if (aadExpiration && aadExpiration <= new Date()) {
          setError("Your access token has expired. Please paste a new token from Power BI.");
          setAADToken(null);
        } else {
          setError("Failed to refresh embed token. The report may become unavailable.");
        }
      }
    }
  }, [aadToken, report, getTokenExpiration]);

  // Sync the latest refreshEmbedToken to the ref to break TDZ
  useEffect(() => {
    refreshEmbedTokenRef.current = refreshEmbedToken;
  }, [refreshEmbedToken]);

  // Helper function to start auto-refresh timer (uses ref to avoid TDZ)
  const startRefreshTimer = useCallback((expiration: string, config: ReportEmbedConfig) => {
    // Clear existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    const expirationTime = new Date(expiration).getTime();
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    
    // Refresh 2 minutes before expiration (or immediately if less than 2 minutes left)
    const refreshTime = Math.max(0, timeUntilExpiration - 2 * 60 * 1000);
    
    console.log(`⏰ Token expires at ${new Date(expiration).toLocaleTimeString()}, refreshing in ${Math.round(refreshTime / 1000)}s`);
    
    const timer = setTimeout(() => {
      console.log("🔄 Auto-refreshing embed token...");
      refreshEmbedTokenRef.current(config);
    }, refreshTime);
    
    setRefreshTimer(timer);
  }, [refreshTimer]);

  // Removed initializePagesInternal - using native Power BI navigation

  // Removed custom action bar control methods - using native Power BI navigation


  // Function to embed report with simple parameters - supports both client-side and server-side auth
  const embed = useCallback(async ({ accessToken, workspaceId, reportId, reportType }: { 
    accessToken?: string; 
    workspaceId: string; 
    reportId: string;
    reportType?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // CRITICAL: Clear pages IMMEDIATELY for paginated reports to prevent showing stale pages
      if (reportType === "PaginatedReport") {
        console.log(`🧹 [Embed] Clearing pages immediately for paginated report (before embed)`);
        setPages([]);
        setCurrentPageId(null);
      }
      
      // Set a dummy AAD token for server-side auth (used by refresh logic)
      if (accessToken) {
        setAADToken(accessToken);
      } else {
        // For server-side auth, set a placeholder token
        setAADToken("server-side-auth");
      }
      
      // Get embed config from backend (initial embedding always starts with View)
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...(accessToken && { accessToken }), // Only include if provided
          workspaceId, 
          reportId,
          accessLevel: "View" // Initial embedding always starts with view-only token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get embed configuration');
      }

      const embedConfig: ReportEmbedConfig = await response.json();
      
      // Now call the internal embed function, passing reportType
      const report = await embedReportInternal(embedConfig, reportType);
      return embedConfig; // Return config for Dashboard compatibility
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  // Internal function to embed with full config
  const embedReportInternal = useCallback(async (embedConfig: ReportEmbedConfig, reportType?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear existing timer if any
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }
      
      // If there's an existing report, try to destroy it first
      if (report) {
        try {
          // Remove all event listeners by specifying each one
          const events = ['loaded', 'error', 'rendered', 'dataSelected', 'pageChanged'];
          events.forEach(event => {
            try {
              report.off(event);
            } catch (e) {
              // Ignore individual event cleanup errors
            }
          });
          
          // Layout cleanup no longer needed - handled during initial embed
          
          setReport(null);
          console.log("🧹 Cleaned up previous report");
        } catch (cleanupError) {
          console.warn("⚠️ Error cleaning up previous report (may be expected):", cleanupError);
        }
      }
      
      // Store current embed config and AAD token info
      setCurrentEmbedConfig(embedConfig);
      currentEmbedConfigRef.current = embedConfig;
      setEmbedTokenExpiration(embedConfig.expiration || null);
      
      // Reset UI state for new report (all new reports start in View mode)
      setCurrentAccessLevel("View");
      currentAccessLevelRef.current = "View";
      setViewMode("view");

      const powerbi = await loadPowerBIScript();
      
      // Get Power BI models for proper enum values (as per Microsoft documentation)
      const models = (window as any)['powerbi-client']?.models || powerbi?.models;
      const config = createPowerBIConfig(embedConfig, "View");
      
      console.log("Power BI SDK loaded successfully");
      console.log("Embed config prepared (token redacted for security)");

      // Wait for container to be available in DOM
      let container = document.getElementById(containerId);
      console.log(`🔍 Looking for container with ID: ${containerId}`);
      
      // If container not found, wait up to 3 seconds for it to appear
      if (!container) {
        console.log(`⏳ Container not found immediately, waiting for it to be rendered...`);
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          container = document.getElementById(containerId);
          if (container) {
            console.log(`✅ Container found after ${(i + 1) * 100}ms`);
            break;
          }
        }
      }
      
      console.log(`🔍 Container found:`, container);
      console.log(`🔍 All containers with 'powerbi' in ID:`, Array.from(document.querySelectorAll('[id*="powerbi"]')).map(el => ({ id: el.id, element: el })));
      
      if (!container) {
        throw new Error(`Container with ID '${containerId}' not found after waiting`);
      }

      // Clear any existing content and reset
      container.innerHTML = "";
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Embed the report
      console.log("Attempting to embed with container:", container);
      const embeddedReport = powerbi.embed(container, config) as PowerBIReport;
      
      // Set up event handlers with better error logging
      embeddedReport.on("loaded", async () => {
        console.log("✅ Report loaded successfully");
        
        // Get Power BI models for proper enum values
        const models = (window as any)['powerbi-client']?.models || powerbi?.models;

        // Responsive re-application function
        const applyResponsive = (report: PowerBIReport, embedConfig: ReportEmbedConfig) => {
          // Skip layout updates when in fullscreen mode
          if (isFullscreenRef.current) {
            console.log('⏭️ Skipping layout update - in fullscreen mode');
            return;
          }
          
          const mobile = isMobileLike();
          console.log(`📱 Applying responsive settings: mobile=${mobile}, viewport=${window.innerWidth}x${window.innerHeight}, touch=${navigator.maxTouchPoints}`);
          
          report.updateSettings({
            layoutType: mobile ? models.LayoutType.MobilePortrait : models.LayoutType.Master,
            panes: {
              pageNavigation: { 
                visible: true, 
                position: models.PageNavigationPosition.Bottom 
              },
              filters: { visible: !mobile && !!embedConfig.settings.filterPaneEnabled },
            },
            bars: {
              statusBar: { visible: !mobile },
              actionBar: { visible: true },
            },
          });
        };

        // Apply initial responsive settings
        applyResponsive(embeddedReport, embedConfig);
        
        // DEBUG: Log reportType to verify it's being passed correctly
        console.log(`🔍 Report loaded - reportType: "${reportType}" (type: ${typeof reportType})`);
        
        // Load pages for custom navigation and debug info - but NOT for paginated reports
        if (reportType !== "PaginatedReport") {
          try {
            (embeddedReport as any).getPages().then((reportPages: any[]) => {
              console.log(`📄 Report has ${reportPages.length} pages:`, reportPages.map((p: any) => p.displayName));
              console.log(`📄 Loaded ${reportPages.length} pages for custom navigation:`, reportPages.map((p: any) => p.displayName));
              
              // Store pages for custom navigation, filtering out hidden pages
              const pageInfo = reportPages
                .filter((p: any) => p.visibility !== 1) // Filter out hidden pages (visibility: 1 = hidden)
                .map((p: any) => ({
                  id: p.name,
                  displayName: p.displayName,
                  isActive: p.isActive || false
                }));
              setPages(pageInfo);
              
              // Set current page
              const activePage = reportPages.find((p: any) => p.isActive);
              if (activePage) {
                setCurrentPageId(activePage.name);
                console.log(`📄 Active page set to: ${activePage.name}`);
              }
              
              // Check if any page has a phone layout
              const pagesWithPhoneLayout = reportPages.filter((p: any) => p.mobileLayout);
              console.log(`📱 Pages with phone layout: ${pagesWithPhoneLayout.length}`, pagesWithPhoneLayout.map((p: any) => p.displayName));
              
              if (reportPages.length <= 1) {
                console.warn("⚠️ Report has only one page - page navigation may be hidden");
              }
              
              if (pagesWithPhoneLayout.length === 0) {
                console.warn("⚠️ No phone layouts found - MobilePortrait will fall back to Master layout");
                console.log("💡 To fix: Open Power BI Desktop → View → Phone layout → Arrange visuals → Republish");
              }
            }).catch((e: any) => console.warn("Failed to get pages:", e));
          } catch (e: any) {
            console.warn("Failed to check pages:", e);
          }
        } else {
          // For paginated reports, clear the pages array to prevent showing stale pages
          console.log(`📄 Paginated report detected - clearing page navigation`);
          setPages([]);
          setCurrentPageId(null);
        }
        
        // Robust layout switching with updateSettings + re-embed fallback
        const PHONE_CANVAS_WIDTH = 375;
        const DESKTOP_MIN_WIDTH = 700;
        const REEMBED_TIMEOUT_MS = 900;
        
        let currentMode: string | null = null;
        const container = document.getElementById(containerId);
        
        if (!container) {
          console.error("Container not found for layout switching");
          setIsLoading(false);
          return;
        }

        // Container CSS helpers
        const applyContainerMobile = () => {
          // Use full available width instead of hardcoded 375px
          container.style.width = '100%';
          container.style.maxWidth = '100%';
          if (container.parentElement) {
            container.parentElement.style.justifyContent = 'center';
            // Remove wrapper scrollbars for mobile - let Power BI handle scrolling
            container.parentElement.style.overflowY = 'visible';
            container.parentElement.style.overflowX = 'hidden';
          }
        };

        const applyContainerDesktop = () => {
          container.style.width = '100%';
          container.style.maxWidth = '100%';
          if (container.parentElement) {
            container.parentElement.style.justifyContent = 'center';
            // Restore wrapper scrolling for desktop
            container.parentElement.style.overflowY = 'auto';
            container.parentElement.style.overflowX = 'hidden';
          }
        };

        // Check if phone canvas is still rendered (for fallback detection)
        const isPhoneCanvasRendered = () => {
          const iframe = container.querySelector('iframe');
          if (!iframe) return true;
          const cs = window.getComputedStyle(iframe);
          const w = parseFloat(cs.width) || iframe.getBoundingClientRect().width;
          const transform = cs.transform || '';
          
          // Since we now use full width for mobile, check viewport width instead
          const viewportWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
          const isMobileViewport = viewportWidth < DESKTOP_MIN_WIDTH;
          
          // For mobile detection: either narrow viewport OR iframe has mobile scaling
          const hasPhoneTransform = transform.includes('scale(') && parseFloat(transform.match(/scale\(([^)]+)\)/)?.[1] || '1') < 1;
          
          return isMobileViewport || hasPhoneTransform;
        };

        // Try updateSettings first (fast method)
        const tryUpdateLayout = async (mode: string) => {
          // Skip layout updates when in fullscreen mode
          if (isFullscreenRef.current) {
            console.log('⏭️ Skipping layout update - in fullscreen mode');
            return;
          }
          
          try {
            const settings = mode === 'desktop' 
              ? { 
                  layoutType: models.LayoutType.Master,
                  panes: { pageNavigation: { visible: true, position: 0 } }
                }
              : { 
                  layoutType: models.LayoutType.MobilePortrait,
                  panes: { pageNavigation: { visible: true, position: 0 } }
                };
            await embeddedReport.updateSettings(settings);
            return true;
          } catch (e) {
            console.warn('updateSettings failed:', e);
            return false;
          }
        };

        // Re-embed fallback (reliable method)
        const reEmbedWithMode = async (mode: string) => {
          if (!currentEmbedConfigRef.current) {
            console.error('No embed config available for re-embedding');
            return;
          }

          try {
            console.log(`🔄 Re-embedding with ${mode} layout`);
            
            // Clear container and re-embed with new layout
            container.innerHTML = "";
            
            const config = createPowerBIConfig(
              currentEmbedConfigRef.current, 
              currentAccessLevelRef.current || "View"
            );
            
            // Override the layout type for the specific mode
            config.settings.layoutType = mode === 'desktop' 
              ? models.LayoutType.Master 
              : models.LayoutType.MobilePortrait;
            
            // Ensure page navigation is visible for both desktop and mobile
            (config.settings as any).panes = {
              pageNavigation: { visible: true, position: 0 }
            };

            const newReport = powerbi.embed(container, config) as PowerBIReport;
            setReport(newReport);
            
            // Set up event handlers for the new report
            newReport.on("loaded", () => {
              console.log(`✅ Re-embed complete with ${mode} layout`);
              setTimeout(() => {
                if (mode === 'desktop') applyContainerDesktop();
                else applyContainerMobile();
              }, 200);
            });

            newReport.on("error", (event: any) => {
              console.error("❌ Re-embedded report error:", event);
            });

          } catch (error) {
            console.error("Failed to re-embed:", error);
          }
        };

        // Main switch function with updateSettings + re-embed fallback
        const switchLayout = async (mode: string) => {
          // Skip layout updates when in fullscreen mode
          if (isFullscreenRef.current) {
            console.log('⏭️ Skipping layout switch - in fullscreen mode');
            return;
          }
          
          if (currentMode === mode) return;
          
          console.log(`[autoSwitch] Switching to ${mode} layout`);
          
          // Apply container styling first
          if (mode === 'mobile') applyContainerMobile();
          else applyContainerDesktop();

          // Try updateSettings first (preferred method)
          const updated = await tryUpdateLayout(mode);
          if (!updated) {
            console.log('[autoSwitch] updateSettings failed -> re-embedding');
            await reEmbedWithMode(mode);
            currentMode = mode;
            return;
          }

          // Check if updateSettings actually worked
          setTimeout(() => {
            const stillPhone = isPhoneCanvasRendered();
            if (mode === 'desktop' && stillPhone) {
              console.log('[autoSwitch] updateSettings didn\'t switch to desktop — re-embedding');
              reEmbedWithMode('desktop');
            } else if (mode === 'mobile' && !stillPhone) {
              console.log('[autoSwitch] unexpected desktop after mobile update — re-embedding');
              reEmbedWithMode('mobile');
            } else {
              console.log(`[autoSwitch] ${mode} layout switch successful`);
            }
            currentMode = mode;
          }, REEMBED_TIMEOUT_MS);
        };

        // Decide which mode based on orientation and width
        const decideMode = () => {
          const isLandscape = window.matchMedia('(orientation: landscape)').matches;
          const width = Math.max(window.innerWidth, document.documentElement.clientWidth);
          
          console.log(`🔍 Layout decision: landscape=${isLandscape}, width=${width}, min=${DESKTOP_MIN_WIDTH}`);
          
          return (isLandscape && width >= DESKTOP_MIN_WIDTH) ? 'desktop' : 'mobile';
        };

        // Debounce helper
        const debounce = (fn: Function, ms: number = 150) => {
          let timeout: NodeJS.Timeout;
          return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), ms);
          };
        };

        // Set up event listeners
        const debouncedSwitch = debounce(() => {
          // Skip layout updates when in fullscreen mode
          if (isFullscreenRef.current) {
            console.log('⏭️ Skipping debounced switch - in fullscreen mode');
            return;
          }
          
          const mode = decideMode();
          switchLayout(mode);
          // Also apply bottom navigation after layout switch
          setTimeout(() => {
            applyResponsive(embeddedReport, embedConfig);
          }, 300);
        }, 200);

        window.addEventListener('orientationchange', debouncedSwitch);
        window.addEventListener('resize', debouncedSwitch);
        
        const orientationMedia = window.matchMedia('(orientation: landscape)');
        if (orientationMedia.addEventListener) {
          orientationMedia.addEventListener('change', debouncedSwitch);
        } else {
          (orientationMedia as any).addListener(debouncedSwitch);
        }

        // Initial layout decision
        setTimeout(() => {
          const mode = decideMode();
          switchLayout(mode);
        }, 350);
        
        setIsLoading(false);
      });

      embeddedReport.on("error", async (event: any) => {
        console.error("❌ Report error event:", event);
        console.error("❌ Event detail:", event.detail);
        console.error("❌ Event detail type:", typeof event.detail);
        
        // Check if this is a Save As error that we can intercept
        const detail = event.detail;
        const isSaveAsError = detail?.message === "ExplorationContainer_FailedToSaveReportDefaultDetails" ||
                             detail?.detailedMessage === "Unable to save the report" ||
                             (detail?.message && detail.message.toLowerCase().includes("save"));
        
        // Get current state using refs to avoid closure issues
        const currentMode = currentAccessLevelRef.current; // Use ref for current state
        const currentConfig = currentEmbedConfigRef.current; // Use ref for current state
        
        // Debug the interception conditions
        console.log("🔍 Save As error check:", {
          isSaveAsError,
          currentAccessLevel: currentMode,
          hasEmbedConfig: !!currentConfig,
          workspaceId: currentConfig?.workspaceId
        });
        
        if (isSaveAsError && currentMode === "Edit" && currentConfig) {
          console.log("🔄 Save As error intercepted - attempting programmatic save to current workspace");
          
          try {
            // Generate a default report name with timestamp
            const timestamp = new Date().toLocaleString().replace(/[/:]/g, '-');
            const defaultName = `Report Copy - ${timestamp}`;
            
            // Use the programmatic saveAs with current workspace
            const saveAsOptions = {
              name: defaultName,
              targetWorkspaceId: currentConfig.workspaceId,
              ...(currentConfig.datasetId && { targetModelId: currentConfig.datasetId })
            };

            console.log("🔄 Programmatic Save As options:", saveAsOptions);
            const result = await (embeddedReport as any).saveAs(saveAsOptions);
            
            console.log("✅ Programmatic Save As completed successfully:", result);
            
            // Show success toast notification
            toast({
              title: "Report Saved Successfully",
              description: `Report "${defaultName}" has been saved to the current workspace`,
            });
            return; // Don't set error state for intercepted Save As
          } catch (saveError) {
            console.error("❌ Programmatic Save As also failed:", saveError);
            // Fall through to show the original error
          }
        }
        
        const errorMessage = detail?.message || detail || "An error occurred while loading the report";
        setError(errorMessage);
        setIsLoading(false);
      });

      embeddedReport.on("rendered", async () => {
        console.log("✅ Report rendered successfully");
        // Removed mobile scaling - using native Power BI MobilePortrait layout instead
      });

      // Add more event listeners for debugging and page tracking
      embeddedReport.on("dataSelected", () => console.log("📊 Data selected"));
      embeddedReport.on("pageChanged", async (event: any) => {
        console.log("📄 Page changed, event:", event);
        // Removed active page state management - using native Power BI navigation
      });
      
      // Note: tokenExpired event not supported in Power BI SDK 2.22.0
      // Auto-refresh relies on timer-based approach instead

      setReport(embeddedReport);
      
      // Start auto-refresh timer if we have expiration info
      if (embedConfig.expiration) {
        startRefreshTimer(embedConfig.expiration, embedConfig);
      }
      
      return embeddedReport;
    } catch (err) {
      // Redact any potential token information from error logs
      const sanitizedError = typeof err === 'object' && err !== null 
        ? { message: err instanceof Error ? err.message : 'Unknown error', type: typeof err }
        : err;
      console.error("Detailed embed error:", sanitizedError);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);
      const message = err instanceof Error ? err.message : `Failed to embed report`;
      setError(message);
      setIsLoading(false);
      throw err;
    }
  }, [containerId]);

  const refreshReport = useCallback(async () => {
    if (report) {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      const FIFTEEN_SECONDS = 15000;

      // Check if we're within the 15-second rate limit
      if (lastRefreshTime > 0 && timeSinceLastRefresh < FIFTEEN_SECONDS) {
        const secondsRemaining = Math.ceil((FIFTEEN_SECONDS - timeSinceLastRefresh) / 1000);
        toast({
          title: "Please wait",
          description: `Power BI limits refreshes to once every 15 seconds. Please wait ${secondsRemaining} more second${secondsRemaining !== 1 ? 's' : ''}.`,
          variant: "default",
          autoClose: true
        });
        return;
      }

      try {
        setIsRefreshDisabled(true);
        setLastRefreshTime(now);
        
        await report.refresh();
        console.log("✅ Report refreshed successfully");
        
        toast({
          title: "Report refreshed",
          description: "The report data has been refreshed successfully.",
          variant: "default",
          autoClose: true
        });

        // Re-enable after 15 seconds
        setTimeout(() => {
          setIsRefreshDisabled(false);
        }, FIFTEEN_SECONDS);
      } catch (err: any) {
        setIsRefreshDisabled(false);
        console.error("Failed to refresh report:", err);
        
        // Check if it's a rate limit error
        if (err.message?.includes('refreshNotAllowed') || err.detailedMessage?.includes('refresh limit')) {
          const match = err.detailedMessage?.match(/(\d+)\s+second/);
          const seconds = match ? match[1] : '15';
          toast({
            title: "Refresh limit reached",
            description: `Power BI limits refreshes to once every ${seconds} seconds. Please wait before trying again.`,
            variant: "destructive",
            autoClose: true
          });
        } else {
          toast({
            title: "Refresh failed",
            description: err.message || "Failed to refresh report",
            variant: "destructive",
            autoClose: true
          });
        }
        setError("Failed to refresh report");
      }
    }
  }, [report, lastRefreshTime]);

  // Note: useQuery moved above to maintain proper hook order

  // Check for refresh completion with enhanced debugging
  useEffect(() => {
    if (refreshInfo.status === 'refreshing' && refreshHistory?.refreshes?.length > 0) {
      const latestRefresh = refreshHistory.refreshes[0]; // Most recent refresh
      
      // DEBUG: Log all refresh data for debugging
      console.log('🔍 COMPLETION CHECK DEBUG:', {
        currentStatus: refreshInfo.status,
        totalRefreshes: refreshHistory.refreshes.length,
        latestRefresh: {
          status: latestRefresh.status,
          startTime: latestRefresh.startTime,
          endTime: latestRefresh.endTime,
          requestId: latestRefresh.requestId,
          id: latestRefresh.id,
          refreshType: latestRefresh.refreshType
        },
        ourStartTime: refreshInfo.startTime?.toISOString(),
        refreshId: refreshInfo.refreshId,
        allRefreshStatuses: refreshHistory.refreshes.slice(0, 3).map((r: any) => ({
          status: r.status,
          startTime: r.startTime,
          endTime: r.endTime,
          requestId: r.requestId || r.id
        }))
      });
      
      // Find our specific refresh by refreshId or by timing
      let targetRefresh = latestRefresh;
      let matchedById = false;
      
      // Try to match by refreshId first (most reliable)
      if (refreshInfo.refreshId) {
        const matchById = refreshHistory.refreshes.find((r: any) => 
          r.requestId === refreshInfo.refreshId || r.id === refreshInfo.refreshId
        );
        if (matchById) {
          targetRefresh = matchById;
          matchedById = true;
          console.log('🎯 Found refresh by ID match:', {
            refreshId: refreshInfo.refreshId,
            foundRefresh: {
              status: targetRefresh.status,
              startTime: targetRefresh.startTime,
              endTime: targetRefresh.endTime
            }
          });
        } else {
          console.warn('⚠️ Could not find refresh by ID, will check timing match');
        }
      }
      
      // Check if this is our current refresh (started after our start time with buffer)
      const ourStartTime = refreshInfo.startTime;
      const refreshStartTime = new Date(targetRefresh.startTime);
      
      // More lenient timing match: 30 second buffer before our start time
      const timingMatch = ourStartTime && refreshStartTime >= new Date(ourStartTime.getTime() - 30000); // 30 second buffer
      
      console.log('🕐 Timing check:', {
        ourStartTime: ourStartTime?.toISOString(),
        refreshStartTime: refreshStartTime.toISOString(),
        timingMatch,
        matchedById,
        timeDifference: ourStartTime ? refreshStartTime.getTime() - ourStartTime.getTime() : 'N/A'
      });
      
      // Check status if we matched by ID OR timing is close
      if (matchedById || timingMatch) {
        // Check for completion (case-insensitive and handle all Power BI status values)
        const status = targetRefresh.status?.toLowerCase();
        
        console.log('🎯 Checking status for matched refresh:', {
          status,
          matchedById,
          timingMatch,
          endTime: targetRefresh.endTime
        });
        
        if (status === 'completed') {
          console.log('✅ Dataset refresh completed successfully');
          setRefreshInfo(prev => ({
            ...prev,
            status: 'completed'
          }));
        } else if (status === 'failed') {
          console.log('❌ Dataset refresh failed:', targetRefresh.serviceExceptionJson || 'Unknown error');
          setRefreshInfo(prev => ({
            ...prev,
            status: 'failed',
            error: targetRefresh.serviceExceptionJson || 'Dataset refresh failed'
          }));
        } else if (status === 'disabled') {
          console.log('🚫 Dataset refresh disabled');
          setRefreshInfo(prev => ({
            ...prev,
            status: 'failed',
            error: 'Dataset refresh is disabled'
          }));
        } else if (status === 'unknown') {
          // Unknown status with an endTime means it completed but status wasn't reported
          if (targetRefresh.endTime) {
            console.log('⚠️ Refresh has unknown status but has endTime - treating as completed');
            setRefreshInfo(prev => ({
              ...prev,
              status: 'completed'
            }));
          } else {
            console.log('❓ Refresh has unknown status without endTime - still in progress');
          }
        } else {
          // In progress or other status
          console.log('🔄 Refresh still in progress, status:', targetRefresh.status);
        }
      } else {
        console.log('⏭️ Latest refresh is not our current refresh (no match by ID or timing)');
        
        // Fallback: If we've been polling for a while and the latest refresh has a completed status
        // and an endTime that's recent, it's likely our refresh completed
        if (ourStartTime && latestRefresh.endTime) {
          const refreshEndTime = new Date(latestRefresh.endTime);
          const timeSinceOurStart = (Date.now() - ourStartTime.getTime()) / 1000; // seconds
          const refreshDuration = (refreshEndTime.getTime() - refreshStartTime.getTime()) / 1000; // seconds
          
          // If we've been waiting long enough and latest refresh is complete, assume it's ours
          if (timeSinceOurStart > 10 && (latestRefresh.status?.toLowerCase() === 'completed' || latestRefresh.status?.toLowerCase() === 'failed')) {
            console.log('🔍 FALLBACK: Our refresh has been running for a while and latest refresh is complete - assuming it\'s ours', {
              timeSinceOurStart: `${timeSinceOurStart}s`,
              latestRefreshStatus: latestRefresh.status,
              latestRefreshDuration: `${refreshDuration}s`
            });
            
            if (latestRefresh.status?.toLowerCase() === 'completed') {
              setRefreshInfo(prev => ({
                ...prev,
                status: 'completed'
              }));
            } else {
              setRefreshInfo(prev => ({
                ...prev,
                status: 'failed',
                error: latestRefresh.serviceExceptionJson || 'Dataset refresh failed'
              }));
            }
          }
        }
      }
    }
  }, [refreshHistory, refreshInfo.status, refreshInfo.startTime, refreshInfo.refreshId]);

  // Sophisticated stopwatch timer with context-aware progress calculation
  useEffect(() => {
    if (refreshInfo.status === 'refreshing' && refreshInfo.startTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - refreshInfo.startTime!.getTime()) / 1000);
        
        // Calculate progress percentage and contextual message using sophisticated algorithm
        let progressPercentage = 0;
        let contextualMessage = "Refresh in progress...";
        
        // Debug logging to track estimation data persistence
        console.log(`⏱️ Timer tick: elapsed=${elapsed}s, hasEstimation=${!!refreshInfo.estimation}, estimationType=${typeof refreshInfo.estimation}`);
        
        if (refreshInfo.estimation) {
          const { 
            averageDurationSeconds, 
            estimateRangeSeconds, 
            contextualFactors, 
            confidenceLevel 
          } = refreshInfo.estimation;
          
          // Use sophisticated progress calculation based on refresh type and context
          const refreshType = 'Manual'; // Default to Manual since refreshType not available in contextualFactors
          const { median, max: p80 } = estimateRangeSeconds;
          const { storageMode, isLargeDataset, recentFailures } = contextualFactors;
          
          // Alpha scaling factors for different refresh types
          const alpha = refreshType === 'Manual' ? 0.85 : 0.75; // Manual refreshes have smoother curves
          
          // Calculate base progress using median-based alpha scaling
          let baseProgress = 0;
          if (elapsed <= 1) {
            // Progress floor: Manual refreshes start at 20% after 1 second
            baseProgress = refreshType === 'Manual' ? 20 : 10;
          } else {
            // Sophisticated alpha-scaled progress: min(95, (elapsed/median)^alpha * 100)
            const normalizedTime = elapsed / median;
            baseProgress = Math.min(95, Math.pow(normalizedTime, alpha) * 100);
            
            // Apply context-aware adjustments
            if (refreshType === 'Manual' && baseProgress < 20) {
              baseProgress = 20; // Maintain 20% floor for manual refreshes
            }
          }
          
          // Handle overruns (when elapsed exceeds P80)
          progressPercentage = baseProgress;
          
          if (elapsed > p80) {
            // Exceeded P80 estimate - show overrun behavior
            progressPercentage = Math.min(90, baseProgress); // Cap at 90% during overrun
            
            const overrunRatio = elapsed / p80;
            if (overrunRatio > 1.5) {
              contextualMessage = "Taking much longer than usual";
            } else {
              contextualMessage = "Taking longer than usual";
            }
            
            // Add specific contextual information for overruns
            // Only show peak hours indicator when refresh exceeds estimate (remaining time = 0)
            const currentHour = new Date().getHours();
            const isPeakHourNow = (currentHour >= 9 && currentHour <= 17);
            
            if (isPeakHourNow) {
              contextualMessage += " (peak hours may cause delays)";
            } else if (recentFailures) {
              contextualMessage += " (previous issues detected)";
            } else if (isLargeDataset) {
              contextualMessage += " (large dataset processing)";
            }
          } else {
            // Normal progress - generate contextual messages based on stage
            const progressRatio = elapsed / median;
            
            if (progressRatio < 0.2) {
              contextualMessage = refreshType === 'Manual' ? "Initiating refresh..." : "Scheduled refresh starting...";
            } else if (progressRatio < 0.5) {
              if (storageMode === "Direct Query") {
                contextualMessage = "Querying data sources...";
              } else if (storageMode === "Import") {
                contextualMessage = "Processing import data...";
              } else {
                contextualMessage = "Processing data...";
              }
            } else if (progressRatio < 0.8) {
              if (isLargeDataset) {
                contextualMessage = "Processing large dataset...";
              } else {
                contextualMessage = refreshType === 'Manual' ? "Nearly complete..." : "Finalizing refresh...";
              }
            } else {
              contextualMessage = "Almost done...";
            }
            
            // Add confidence indicators for low confidence estimates
            if (confidenceLevel === 'low' && progressRatio > 0.5) {
              contextualMessage += " (time estimate improving)";
            }
          }
          
          progressPercentage = Math.floor(progressPercentage);
          
          // Debug logging for sophisticated progress calculation
          console.log(`🔢 Sophisticated progress: elapsed=${elapsed}s, median=${estimateRangeSeconds.median}s, p80=${estimateRangeSeconds.max}s, progress=${progressPercentage}%, type=${refreshType}`);
          
        } else {
          // No estimation data - provide basic contextual messages with better defaults
          console.log(`❗ No estimation data available for progress calculation`);
          
          // Provide fallback progress calculation
          if (elapsed < 30) {
            progressPercentage = Math.min(20, elapsed * 2); // Gradual start up to 20%
            contextualMessage = "Refresh starting...";
          } else if (elapsed < 120) {
            progressPercentage = 20 + Math.min(40, (elapsed - 30) * 0.44); // 20% to 60% over 90s
            contextualMessage = "Processing...";
          } else if (elapsed < 300) {
            progressPercentage = 60 + Math.min(25, (elapsed - 120) * 0.14); // 60% to 85% over 180s
            contextualMessage = "Still processing...";
          } else {
            progressPercentage = Math.min(90, 85 + (elapsed - 300) * 0.02); // Cap at 90%
            contextualMessage = "This is taking a while...";
          }
        }
        
        setRefreshInfo(prev => ({
          ...prev,
          elapsedTime: elapsed,
          progressPercentage,
          contextualMessage
        }));
      }, 1000);
      
      setRefreshIntervalTimer(timer);
      
      return () => {
        clearInterval(timer);
        setRefreshIntervalTimer(null);
      };
    } else {
      // Clear timer when not refreshing
      if (refreshIntervalTimer) {
        clearInterval(refreshIntervalTimer);
        setRefreshIntervalTimer(null);
      }
    }
  }, [refreshInfo.status, refreshInfo.startTime, refreshInfo.estimation]);
  

  const refreshDataset = useCallback(async () => {
    if (!currentEmbedConfig?.workspaceId || !currentEmbedConfig?.datasetId) {
      throw new Error("Missing workspace ID or dataset ID for dataset refresh");
    }

    try {
      console.log("🔄 Requesting dataset refresh...");
      
      // First get the API response to get estimation data
      const response = await fetch(`/api/powerbi/workspaces/${currentEmbedConfig.workspaceId}/datasets/${currentEmbedConfig.datasetId}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          console.error("Received HTML error page instead of JSON response");
          const errorMessage = "This dataset uses Direct Query or Live Connection mode and does not support manual refresh. Data is fetched in real-time from the source.";
          
          setRefreshInfo({
            status: 'failed',
            startTime: null,
            elapsedTime: 0,
            error: errorMessage,
            estimation: undefined
          });
          
          toast({
            title: "Refresh Not Supported",
            description: errorMessage,
            variant: "default",
            duration: 5000,
          });
          
          return; // Don't throw, just return gracefully
        }
        
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to refresh dataset";
        
        console.log("🔍 Frontend received error response but checking for estimation:", {
          hasEstimation: !!errorData.estimation,
          estimationType: typeof errorData.estimation,
          errorData
        });
        
        // IMPORTANT: Even if refresh fails, check if we got estimation data for testing/debugging
        const estimation = errorData.estimation;
        
        // Set refresh state to failed but include any estimation data we received
        setRefreshInfo({
          status: 'failed',
          startTime: null,
          elapsedTime: 0,
          error: errorMessage,
          estimation // Include estimation even on failure for debugging
        });
        
        console.log("⚠️ Refresh failed but set estimation data:", {
          hasEstimation: !!estimation,
          estimation: estimation ? {
            averageDurationSeconds: estimation.averageDurationSeconds,
            confidenceLevel: estimation.confidenceLevel
          } : 'none'
        });
        
        throw new Error(errorMessage);
      }

      // Extract refreshId and estimation from response
      const responseData = await response.json();
      const refreshId = responseData.refreshId;
      const estimation = responseData.estimation;
      
      console.log("🔍 Frontend received refresh API response:", {
        refreshId,
        hasEstimation: !!estimation,
        estimationType: typeof estimation,
        estimationKeys: estimation ? Object.keys(estimation) : 'none',
        rawResponse: responseData
      });
      
      // NOW set the refresh state with ALL data including estimation
      // This ensures the timer effect will have estimation data available immediately
      const startTime = new Date();
      const newRefreshInfo = {
        status: 'refreshing' as const,
        startTime,
        elapsedTime: 0,
        refreshId,
        estimation,
        progressPercentage: 0,
        contextualMessage: estimation?.message || "Refresh starting...",
        error: undefined
      };
      
      console.log("🔧 Setting refreshInfo with estimation:", {
        hasEstimation: !!newRefreshInfo.estimation,
        estimationData: newRefreshInfo.estimation ? {
          averageDurationSeconds: newRefreshInfo.estimation.averageDurationSeconds,
          confidenceLevel: newRefreshInfo.estimation.confidenceLevel,
          storageMode: newRefreshInfo.estimation.contextualFactors?.storageMode
        } : 'null'
      });
      
      setRefreshInfo(newRefreshInfo);

      console.log("✅ Dataset refresh initiated successfully", refreshId ? `(refreshId: ${refreshId})` : '');
      console.log("📊 Estimation data:", estimation ? `${estimation.averageDurationSeconds}s average, ${estimation.confidenceLevel} confidence` : 'No estimation available');
      // Polling will now start automatically due to the enabled condition in useQuery
    } catch (err) {
      console.error("Failed to refresh dataset:", err);
      setError("Failed to refresh dataset");
      throw err;
    }
  }, [currentEmbedConfig]);

  const cancelDatasetRefresh = useCallback(async () => {
    if (!currentEmbedConfig?.workspaceId || !currentEmbedConfig?.datasetId) {
      throw new Error("Missing workspace ID or dataset ID for dataset refresh cancellation");
    }

    if (!refreshInfo.refreshId) {
      throw new Error("No active refresh ID found for cancellation");
    }

    if (refreshInfo.status !== 'refreshing') {
      throw new Error("No active refresh to cancel");
    }

    try {
      const deleteUrl = `/api/powerbi/workspaces/${currentEmbedConfig.workspaceId}/datasets/${currentEmbedConfig.datasetId}/refreshes/${refreshInfo.refreshId}`;
      console.log("🛑 Cancelling dataset refresh...");
      console.log("📍 DELETE URL:", deleteUrl);
      console.log("🔑 RefreshId:", refreshInfo.refreshId);
      
      // Update status to show cancellation in progress
      setRefreshInfo(prev => ({
        ...prev,
        status: 'cancelling'
      }));
      
      console.log("📤 Sending DELETE request...");
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log("📥 DELETE response received:", { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to cancel dataset refresh";
        
        // Revert to refreshing state if cancellation failed
        setRefreshInfo(prev => ({
          ...prev,
          status: 'refreshing',
          error: errorMessage
        }));
        
        throw new Error(errorMessage);
      }

      // Update refresh state to cancelled
      setRefreshInfo(prev => ({
        ...prev,
        status: 'cancelled',
        error: undefined
      }));

      console.log("✅ Dataset refresh cancelled successfully");
    } catch (err) {
      console.error("Failed to cancel dataset refresh:", err);
      setError("Failed to cancel dataset refresh");
      throw err;
    }
  }, [currentEmbedConfig, refreshInfo]);

  const applyFilters = useCallback(async (filters: ReportFilters) => {
    if (!report) return;

    try {
      const powerBIFilters = convertToPowerBIFilters(filters);
      await report.setFilters(powerBIFilters);
    } catch (err) {
      console.error("Failed to apply filters:", err);
      setError("Failed to apply filters");
    }
  }, [report]);

  const switchToEditMode = useCallback(async () => {
    if (!report) {
      throw new Error("No report available to switch to edit mode");
    }

    if (!aadToken || !currentEmbedConfig) {
      throw new Error("Missing authentication token or embed configuration");
    }

    try {
      console.log("🔄 Requesting edit token...");
      
      // Request a new embed token with Edit access level
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(aadToken !== "server-side-auth" && { accessToken: aadToken }), // Only include if not server-side
          workspaceId: currentEmbedConfig.workspaceId,
          reportId: currentEmbedConfig.reportId,
          accessLevel: "Edit",
          allowSaveAs: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to get edit token");
      }

      const editEmbedConfig = await response.json();
      
      // Apply the new edit token to the existing report
      await (report as any).setAccessToken(editEmbedConfig.accessToken);
      
      // Update state and refs
      setCurrentAccessLevel("Edit");
      currentAccessLevelRef.current = "Edit";
      setCurrentEmbedConfig(editEmbedConfig);
      currentEmbedConfigRef.current = editEmbedConfig;
      setEmbedTokenExpiration(editEmbedConfig.expiration);
      
      // Re-embed with proper edit mode configuration (includes viewMode: Edit for action bar)
      const powerbi = await loadPowerBIScript();
      const editConfig = createPowerBIConfig(editEmbedConfig, "Edit");
      
      // Now switch to edit mode first
      await report.switchMode("edit");
      
      // Wait a moment for the mode switch to complete, then apply settings
      await new Promise(resolve => setTimeout(resolve, 500));
      await report.updateSettings(editConfig.settings);
      
      // Apply fit-to-page layout after mode switch
      setTimeout(async () => {
        try {
          const models = (window as any).powerbi?.models;
          if (models) {
            await report.updateSettings({
              layoutType: models.LayoutType.Custom,
              customLayout: {
                displayOption: models.DisplayOption.FitToPage
              }
            });
            console.log("✅ Applied fit-to-page layout in edit mode");
          } else {
            // Fallback: try using numeric values directly
            await report.updateSettings({
              layoutType: 1, // Custom = 1
              customLayout: {
                displayOption: 0 // FitToPage = 0
              }
            });
            console.log("✅ Applied fit-to-page layout in edit mode (fallback)");
          }
        } catch (layoutError) {
          console.warn("Failed to apply fit-to-page layout in edit mode:", layoutError);
        }
      }, 300);
      
      setViewMode("edit");
      
      console.log("✅ Switched to edit mode with new token");
    } catch (err) {
      console.error("Failed to switch to edit mode:", err);
      // Preserve the original error details for better error handling
      throw err;
    }
  }, [report, aadToken, currentEmbedConfig]);

  const switchToViewMode = useCallback(async () => {
    if (!report) {
      throw new Error("No report available to switch to view mode");
    }

    if (!aadToken || !currentEmbedConfig) {
      throw new Error("Missing authentication token or embed configuration");
    }

    try {
      console.log("🔄 Requesting view token...");
      
      // Request a new embed token with View access level
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(aadToken !== "server-side-auth" && { accessToken: aadToken }), // Only include if not server-side
          workspaceId: currentEmbedConfig.workspaceId,
          reportId: currentEmbedConfig.reportId,
          accessLevel: "View"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to get view token");
      }

      const viewEmbedConfig = await response.json();
      
      // Apply the new view token to the existing report
      await (report as any).setAccessToken(viewEmbedConfig.accessToken);
      
      // Update state and refs
      setCurrentAccessLevel("View");
      currentAccessLevelRef.current = "View";
      setCurrentEmbedConfig(viewEmbedConfig);
      currentEmbedConfigRef.current = viewEmbedConfig;
      setEmbedTokenExpiration(viewEmbedConfig.expiration);
      
      // Re-embed with proper view mode configuration
      const powerbi = await loadPowerBIScript();
      const viewConfig = createPowerBIConfig(viewEmbedConfig, "View");
      
      // Now switch to view mode first
      await report.switchMode("view");
      
      // Wait a moment for the mode switch to complete, then apply settings
      await new Promise(resolve => setTimeout(resolve, 500));
      await report.updateSettings(viewConfig.settings);
      
      // Apply fit-to-page layout after mode switch
      setTimeout(async () => {
        try {
          const models = (window as any).powerbi?.models;
          if (models) {
            await report.updateSettings({
              layoutType: models.LayoutType.Custom,
              customLayout: {
                displayOption: models.DisplayOption.FitToPage
              }
            });
            console.log("✅ Applied fit-to-page layout in view mode");
          } else {
            // Fallback: try using numeric values directly
            await report.updateSettings({
              layoutType: 1, // Custom = 1
              customLayout: {
                displayOption: 0 // FitToPage = 0
              }
            });
            console.log("✅ Applied fit-to-page layout in view mode (fallback)");
          }
        } catch (layoutError) {
          console.warn("Failed to apply fit-to-page layout in view mode:", layoutError);
        }
      }, 300);
      
      setViewMode("view");
      
      console.log("✅ Switched to view mode with new token");
    } catch (err) {
      console.error("Failed to switch to view mode:", err);
      // Preserve the original error details for better error handling
      throw err;
    }
  }, [report, aadToken, currentEmbedConfig]);

  const toggleFullscreen = useCallback(() => {
    if (report) {
      try {
        if (document.fullscreenElement) {
          report.exitFullscreen();
        } else {
          report.fullscreen();
        }
      } catch (err) {
        console.error("Failed to toggle fullscreen:", err);
      }
    }
  }, [report]);

  // Sync fullscreen state with browser fullscreen events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      isFullscreenRef.current = isCurrentlyFullscreen;
      console.log("🔄 Fullscreen state synced:", isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      if (refreshIntervalTimer) {
        clearInterval(refreshIntervalTimer);
      }
    };
  }, [refreshTimer, refreshIntervalTimer]);

  // Toggle function for convenience
  const toggleViewMode = useCallback(async () => {
    if (viewMode === "view") {
      await switchToEditMode();
    } else {
      await switchToViewMode();
    }
  }, [viewMode, switchToEditMode, switchToViewMode]);

  // Function to switch to a specific page
  const switchToPage = useCallback(async (pageId: string) => {
    if (!report) {
      console.warn("Cannot switch page: no report available");
      return;
    }

    try {
      console.log(`📄 Switching to page: ${pageId}`);
      
      // Get the page by ID and set it as active
      const targetPage = await (report as any).getPages().then((reportPages: any[]) => 
        reportPages.find((p: any) => p.name === pageId)
      );
      
      if (targetPage) {
        await targetPage.setActive();
        setCurrentPageId(pageId);
        
        // Update pages state to reflect the active page
        setPages(prevPages => 
          prevPages.map(p => ({
            ...p,
            isActive: p.id === pageId
          }))
        );
        
        console.log(`✅ Successfully switched to page: ${targetPage.displayName}`);
      } else {
        console.error(`❌ Page not found: ${pageId}`);
      }
    } catch (error) {
      console.error("❌ Failed to switch page:", error);
    }
  }, [report]);

  // Custom Save As function that bypasses built-in UI and saves to current workspace
  const saveAs = useCallback(async (reportName: string) => {
    if (!report) {
      throw new Error("No report available to save");
    }

    if (!currentEmbedConfig) {
      throw new Error("Missing embed configuration");
    }

    if (currentAccessLevel !== "Edit") {
      throw new Error("Report must be in edit mode to save as");
    }

    try {
      console.log("🔄 Starting programmatic Save As...");
      
      // Use report.saveAs() with explicit targetWorkspaceId (current workspace)
      const saveAsOptions = {
        name: reportName,
        targetWorkspaceId: currentEmbedConfig.workspaceId,
        // Include dataset ID if available for cross-workspace scenarios
        ...(currentEmbedConfig.datasetId && { targetModelId: currentEmbedConfig.datasetId })
      };

      console.log("🔄 Save As options:", { 
        name: reportName, 
        targetWorkspaceId: currentEmbedConfig.workspaceId,
        hasDatasetId: !!currentEmbedConfig.datasetId 
      });

      const result = await (report as any).saveAs(saveAsOptions);
      
      console.log("✅ Save As completed successfully:", result);
      return result;
    } catch (err) {
      console.error("❌ Save As failed:", err);
      throw err;
    }
  }, [report, currentEmbedConfig, currentAccessLevel]);

  return {
    report,
    embed,
    embedReport: embed, // Alias for Dashboard compatibility
    applyFilters,
    refreshReport,
    refreshDataset,
    cancelDatasetRefresh, // New cancel function
    toggleFullscreen,
    switchToEditMode,
    switchToViewMode,
    toggleViewMode,
    saveAs,
    viewMode,
    currentAccessLevel,
    isLoading,
    error,
    setAADToken, // Expose this so Dashboard can set the AAD token
    // Refresh tracking state and functions
    refreshInfo,
    isRefreshDisabled, // Rate limit state for report refresh
    resetRefreshState: useCallback(() => {
      setRefreshInfo({
        status: 'idle',
        startTime: null,
        elapsedTime: 0
      });
    }, []),
    // Page navigation functionality
    pages,
    currentPageId,
    switchToPage,
    // Removed custom action bar - using native Power BI controls
  };
}

function convertToPowerBIFilters(filters: ReportFilters): any[] {
  const powerBIFilters: any[] = [];

  // Date range filter
  if (filters.startDate || filters.endDate) {
    powerBIFilters.push({
      $schema: "http://powerbi.com/product/schema#advanced",
      target: {
        table: "Date",
        column: "Date"
      },
      operator: "And",
      conditions: [
        ...(filters.startDate ? [{
          operator: "GreaterThanOrEqual",
          value: filters.startDate
        }] : []),
        ...(filters.endDate ? [{
          operator: "LessThanOrEqual", 
          value: filters.endDate
        }] : [])
      ]
    });
  }

  // Region filter
  if (filters.region && filters.region.length > 0) {
    powerBIFilters.push({
      $schema: "http://powerbi.com/product/schema#basic",
      target: {
        table: "Geography",
        column: "Region"
      },
      operator: "In",
      values: filters.region
    });
  }

  // Categories filter
  if (filters.categories && filters.categories.length > 0) {
    powerBIFilters.push({
      $schema: "http://powerbi.com/product/schema#basic",
      target: {
        table: "Product",
        column: "Category"
      },
      operator: "In",
      values: filters.categories
    });
  }

  // Sales channel filter
  if (filters.salesChannel && filters.salesChannel !== "all") {
    powerBIFilters.push({
      $schema: "http://powerbi.com/product/schema#basic",
      target: {
        table: "Sales",
        column: "Channel"
      },
      operator: "In",
      values: [filters.salesChannel]
    });
  }

  return powerBIFilters;
}

// Simplified - no saved filters for now
export function useSavedFilters() {
  return {
    savedFilters: [],
    isLoading: false,
    saveFilter: async () => {},
    deleteFilter: async () => {},
    isSaving: false,
    isDeleting: false,
  };
}
