import * as models from "powerbi-models";
import { type ReportEmbedConfig } from "@shared/schema";

export interface PowerBIConfig {
  type: "report" | "paginatedReport";
  tokenType: number;
  accessToken: string;
  embedUrl: string;
  id: string;
  permissions: number;
  viewMode: number;
  settings: any; // keep flexible to allow panes etc.
}

// Orientation-aware mobile detection - switches to desktop layout in landscape
export function isMobileLike(): boolean {
  if (typeof window === "undefined") return false;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const touch = navigator.maxTouchPoints > 0;
  
  // Check if this is actually a mobile device (not just a narrow desktop window)
  const isMobileUserAgent = !!(navigator.userAgent && /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i.test(navigator.userAgent));
  
  // Orientation-aware approach: use current width, not minimum dimension
  // This allows mobile devices to use desktop layout when in landscape
  const isActualMobile = (width <= 768 && (touch || isMobileUserAgent)) || 
                        (width <= 480); // Very narrow screens are definitely phones
  
  // Debug logging
  console.log(`📱 Mobile detection: width=${width}, height=${height}, touch=${touch}, UA=${navigator.userAgent.slice(0, 50)}...`);
  console.log(`📱 Detection result: isMobileUserAgent=${isMobileUserAgent}, isActualMobile=${isActualMobile}`);
  console.log(`📱 Final mobile decision: ${isActualMobile}`);
  
  return isActualMobile;
}

export function createPowerBIConfig(
  embedConfig: ReportEmbedConfig,
  accessLevel: "View" | "Edit" = "View"
): PowerBIConfig {
  const mobile = isMobileLike();
  const isPaginatedReport = embedConfig.reportType === 'PaginatedReport';
  
  console.log(`🔧 Creating Power BI config: type=${embedConfig.reportType || 'Report'}, mobile=${mobile}, accessLevel=${accessLevel}`);

  // Determine embed type based on report type
  const embedType: "report" | "paginatedReport" = isPaginatedReport ? "paginatedReport" : "report";

  return {
    type: embedType,
    tokenType: 1,
    accessToken: embedConfig.accessToken,
    embedUrl: embedConfig.embedUrl,
    id: embedConfig.reportId,
    permissions: 7,
    viewMode: accessLevel === "Edit" ? 1 : 0,
    settings: {
      // IMPORTANT: do NOT set navContentPaneEnabled at all
      // (it forces the legacy left pane and ignores Bottom)
      filterPaneEnabled: !mobile && !!embedConfig.settings.filterPaneEnabled,
      background: 1,
      layoutType: mobile
        ? models.LayoutType.MobilePortrait
        : models.LayoutType.Master,
      bars: {
        statusBar: { visible: !mobile },
        actionBar: { visible: true },
      },
      panes: {
        pageNavigation: {
          visible: true,
          position: models.PageNavigationPosition.Bottom, // Bottom for desktop + mobile
        },
        filters: { visible: !mobile && !!embedConfig.settings.filterPaneEnabled },
      },
    },
  };
}

export function loadPowerBIScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).powerbi) {
      resolve((window as any).powerbi);
      return;
    }

    const tryLoadScript = (scriptUrl: string, isRetry = false) => {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        // Wait a bit for the script to initialize
        setTimeout(() => {
          if ((window as any).powerbi) {
            console.log(`Power BI script loaded successfully from ${scriptUrl}`);
            resolve((window as any).powerbi);
          } else {
            console.error(`Power BI script loaded from ${scriptUrl} but powerbi object not found`);
            if (!isRetry) {
              console.log("Trying fallback CDN...");
              tryLoadScript("https://unpkg.com/powerbi-client@latest/dist/powerbi.min.js", true);
            } else {
              reject(new Error("Power BI script loaded but powerbi object not found"));
            }
          }
        }, 200);
      };

      script.onerror = (error) => {
        console.error(`Failed to load Power BI script from ${scriptUrl}`, error);
        if (!isRetry) {
          console.log("Trying fallback CDN...");
          tryLoadScript("https://unpkg.com/powerbi-client@latest/dist/powerbi.min.js", true);
        } else {
          reject(new Error("Failed to load Power BI script from all CDN sources"));
        }
      };

      document.head.appendChild(script);
    };

    // Start with Microsoft's official CDN (latest version for better navigation support)
    tryLoadScript("https://cdn.powerbi.com/lib/powerbi-client/latest/powerbi.min.js");
  });
}

export type PowerBIReport = {
  id: string;
  name: string;
  embedUrl: string;
  getFilters: () => Promise<any[]>;
  setFilters: (filters: any[]) => Promise<void>;
  updateFilters: (filters: any[]) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  refresh: () => Promise<void>;
  fullscreen: () => void;
  exitFullscreen: () => void;
  switchMode: (mode: string) => Promise<void>;
  on: (event: string, callback: (event: any) => void) => void;
  off: (event: string, callback?: (event: any) => void) => void;
};
