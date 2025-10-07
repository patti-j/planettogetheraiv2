import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePowerBIDataset, type PowerBIDataset } from "@/hooks/use-powerbi-api";
import { Database, Loader2, AlertTriangle, ChartBar, BadgeCheck, Wand2, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface PowerBIEmbedProps {
  className?: string;
  reportName?: string;
  workspaceId?: string;
  datasetId?: string;
  isAuthenticated?: boolean;
  viewMode?: "view" | "edit";
  pages?: Array<{id: string, displayName: string, isActive: boolean}>;
  currentPageId?: string | null;
  onPageChange?: (pageId: string) => void;
  showMobileBackButton?: boolean;
  onMobileBackClick?: () => void;
}

export function PowerBIEmbed({ 
  className, 
  reportName, 
  workspaceId, 
  datasetId,
  isAuthenticated = false,
  viewMode = "view",
  pages = [],
  currentPageId = null,
  onPageChange,
  showMobileBackButton = false,
  onMobileBackClick
}: PowerBIEmbedProps) {
  // Mobile detection state for responsive container sizing
  const [isMobile, setIsMobile] = useState(false);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<'mobile' | 'desktop' | null>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    
    checkMobile();
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addEventListener('change', checkMobile);
    
    return () => mediaQuery.removeEventListener('change', checkMobile);
  }, []);

  // Body scroll control for mobile mode
  useEffect(() => {
    const updateBodyScroll = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const width = Math.max(window.innerWidth, document.documentElement.clientWidth);
      const shouldUseMobileLayout = !(isLandscape && width >= 700);
      
      const newLayoutMode = shouldUseMobileLayout ? 'mobile' : 'desktop';
      setCurrentLayoutMode(newLayoutMode);
      
      // Apply or remove body scroll lock
      if (shouldUseMobileLayout) {
        // Lock body scroll for mobile - prevent outer page scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        console.log('🔒 Body scroll locked for mobile layout');
      } else {
        // Restore body scroll for desktop
        document.body.style.overflow = '';
        document.body.style.height = '';
        console.log('🔓 Body scroll restored for desktop layout');
      }
    };
    
    // Initial check
    updateBodyScroll();
    
    // Listen for orientation and resize changes
    window.addEventListener('orientationchange', updateBodyScroll);
    window.addEventListener('resize', updateBodyScroll);
    
    const orientationMedia = window.matchMedia('(orientation: landscape)');
    if (orientationMedia.addEventListener) {
      orientationMedia.addEventListener('change', updateBodyScroll);
    } else {
      (orientationMedia as any).addListener(updateBodyScroll);
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      window.removeEventListener('orientationchange', updateBodyScroll);
      window.removeEventListener('resize', updateBodyScroll);
      if (orientationMedia.removeEventListener) {
        orientationMedia.removeEventListener('change', updateBodyScroll);
      } else {
        (orientationMedia as any).removeListener(updateBodyScroll);
      }
    };
  }, []);
  
  // Fetch dataset information when we have all required data
  const { data: dataset, isLoading: isLoadingDataset, error: datasetError } = usePowerBIDataset(
    isAuthenticated,
    workspaceId || "",
    datasetId || ""
  );

  // Check if this is a standard report (report name matches dataset name)
  const isStandardReport = reportName && dataset && reportName.trim() === dataset.name.trim();

  const getStorageModeDisplay = (mode: PowerBIDataset["storageMode"]) => {
    // Handle both variants for display
    if (/^direct\s*query$/i.test(mode)) {
      return "DirectQuery";
    }
    
    switch (mode) {
      case "Import":
        return "Import";
      case "LiveConnection":
        return "Live";
      case "Composite":
        return "Composite";
      case "Unknown":
        return "Unknown";
      default:
        return "Unknown";
    }
  };

  const getStorageModeColor = (mode: PowerBIDataset["storageMode"]) => {
    // Handle both variants for colors
    if (/^direct\s*query$/i.test(mode)) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
    
    switch (mode) {
      case "Import":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "LiveConnection":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Composite":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Unknown":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStorageModeTooltip = (mode: PowerBIDataset["storageMode"]) => {
    // Handle both variants for tooltips
    if (/^direct\s*query$/i.test(mode)) {
      return "Data is queried directly from the source in real-time. No data is stored in Power BI, ensuring always up-to-date results but potentially slower performance.";
    }
    
    switch (mode) {
      case "Import":
        return "Data is copied and stored in Power BI for fast query performance. Data needs to be refreshed periodically to stay current.";
      case "LiveConnection":
        return "Direct connection to Analysis Services. Queries are passed through to the source system while leveraging server processing power.";
      case "Composite":
        return "Mixed approach combining imported data with real-time queries. Some tables are cached while others use direct query for optimal performance.";
      case "Unknown":
        return "Storage mode could not be determined. This may indicate an issue accessing dataset information.";
      default:
        return "Storage mode information is not available.";
    }
  };

  const getReportTypeDisplay = (isStandard: boolean) => {
    return isStandard ? "Standard" : "Custom";
  };

  const getReportTypeColor = (isStandard: boolean) => {
    return isStandard 
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getReportTypeTooltip = (isStandard: boolean) => {
    return isStandard 
      ? "Standard"
      : "This is a custom report where the report name differs from the dataset name";
  };

  return (
    <div className={className}>
      {/* Report Information Header - separate from embed container */}
      {(reportName || dataset) && (
        <div className="mb-0" data-testid="power-bi-info-header">
          <div className="p-4 sm:p-2 md:p-4" data-testid="report-info-content">
            <div className="space-y-0">
              
              {/* Report Name with Page Navigation Dropdown */}
              {reportName && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {/* Report Type Icon */}
                    {dataset && (
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          {isStandardReport ? (
                            <BadgeCheck className="w-4 h-4 text-green-600 dark:text-green-300" />
                          ) : (
                            <Wand2 className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white border border-border" side="bottom">
                          <p className="text-sm text-black">{getReportTypeTooltip(!!isStandardReport)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {/* Report name with optional page dropdown */}
                    {pages && pages.length > 1 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 -ml-2" data-testid="dropdown-page-navigation">
                          <h3 className="text-lg font-semibold text-foreground">
                            {reportName}
                          </h3>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 bg-white border border-gray-200 shadow-md" data-testid="dropdown-page-list">
                          {pages.map((page, index) => (
                            <DropdownMenuItem
                              key={page.id}
                              onClick={() => onPageChange?.(page.id)}
                              className={`cursor-pointer ${
                                page.id === currentPageId ? "bg-accent text-accent-foreground" : ""
                              }`}
                              data-testid={`menu-item-page-${index}`}
                            >
                              <span className="truncate">{page.displayName}</span>
                              {page.id === currentPageId && (
                                <span className="ml-auto text-xs text-muted-foreground">Current</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <h3 className="text-lg font-semibold text-foreground" data-testid="text-report-name">
                        {reportName}
                      </h3>
                    )}
                  </div>
                  {/* Warning icon for standard reports in edit mode */}
                  {viewMode === "edit" && isStandardReport && (
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        <AlertTriangle 
                          className="w-5 h-5 text-amber-500 hover:text-amber-600" 
                          data-testid="icon-standard-report-warning"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" side="bottom">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          This is a standard report and for the standard reports saving and overwriting is not recommended. 
                          The recommendation here is that to save as a copy with different naming to prevent the standard report from being overwritten.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
              
              {/* Dataset Information */}
              <div className="flex items-center gap-4 text-sm">
                {isLoadingDataset ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ) : dataset ? (
                  <>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <Database className="w-4 h-4" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white border border-border" side="bottom">
                          <p className="text-sm text-black">Power BI Dataset</p>
                        </TooltipContent>
                      </Tooltip>
                      <span data-testid="text-dataset-name">{dataset.name}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        <Badge 
                          className={`text-xs font-medium ${getStorageModeColor(dataset.storageMode)}`}
                          data-testid="badge-storage-mode"
                        >
                          {getStorageModeDisplay(dataset.storageMode)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-white border border-border" side="bottom">
                        <p className="text-sm text-black">{getStorageModeTooltip(dataset.storageMode)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : datasetError ? (
                  <>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <Database className="w-4 h-4" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white border border-border" side="bottom">
                          <p className="text-sm text-black">Power BI Dataset</p>
                        </TooltipContent>
                      </Tooltip>
                      <span data-testid="text-dataset-name">Dataset info unavailable</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        <Badge 
                          className={`text-xs font-medium ${getStorageModeColor("Unknown")}`}
                          data-testid="badge-storage-mode"
                        >
                          {getStorageModeDisplay("Unknown")}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-white border border-border" side="bottom">
                        <p className="text-sm text-black">{getStorageModeTooltip("Unknown")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : workspaceId && datasetId && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading dataset info...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified container for native Power BI layout */}
      <div 
        id="embedWrapper" 
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0',
          padding: '0',
          height: '100%',
          // Mobile: let Power BI handle scrolling, Desktop: enable container scrolling
          overflowY: isMobile ? 'visible' : 'auto',
          overflowX: 'hidden',
          position: 'relative'
        }}
        data-testid="powerbi-embed-wrapper"
      >
        <div 
          id="reportContainer"
          style={{
            width: '100%',
            height: '100%',
            margin: '0',
            padding: '0',
            boxSizing: 'border-box'
          }}
          data-testid="powerbi-embed-container"
        />
      </div>
    </div>
  );
}