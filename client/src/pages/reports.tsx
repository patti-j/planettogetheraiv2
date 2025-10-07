import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { PowerBIEmbed } from "@/components/power-bi-embed";
import { usePowerBIEmbed } from "@/hooks/use-power-bi";
import { usePowerBIAuth, usePowerBIWorkspaces, usePowerBIReports } from "@/hooks/use-powerbi-api";
import { usePowerBIExport } from "@/hooks/use-powerbi-export";
import { type ReportEmbedConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { RefreshStopwatch, useRefreshNotifications } from "@/components/refresh-stopwatch";
import { 
  ChartBar, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Maximize2,
  RotateCcw,
  Download,
  Edit,
  Eye,
  Database,
  Filter,
  CheckCircle2,
  ListFilter,
  BadgeCheck,
  Wand2,
  FileDown,
  ArrowLeft,
  X
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import * as models from "powerbi-models";

// Report Type Helper Component
function ReportTypeMark({ type, showLabel = true }: { type: 'all' | 'standard' | 'custom', showLabel?: boolean }) {
  const getIcon = () => {
    switch (type) {
      case 'all':
        return ListFilter;
      case 'standard':
        return BadgeCheck;
      case 'custom':
        return Wand2;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'all':
        return "text-foreground";
      case 'standard':
        return "text-green-600 dark:text-green-300";
      case 'custom':
        return "text-yellow-600 dark:text-yellow-300";
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'all':
        return "All";
      case 'standard':
        return "Standard";
      case 'custom':
        return "Custom";
    }
  };

  const Icon = getIcon();

  return (
    <div className={`inline-flex items-center gap-1 leading-none ${getColorClasses()}`}>
      <Icon className="w-4 h-4" />
      {showLabel && <span>{getLabel()}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<{id: string, name: string} | null>(null);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [embedConfig, setEmbedConfig] = useState<ReportEmbedConfig | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState<"all" | "standard" | "custom">("all");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [filterPaneVisible, setFilterPaneVisible] = useState(false);
  const [showMobileFilterDrawer, setShowMobileFilterDrawer] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  // Refs to track timeouts and prevent race conditions
  const embedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOperationRef = useRef<string | null>(null);
  const orientationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync filter pane state with actual PowerBI pane when report loads
  useEffect(() => {
    const syncFilterPaneState = async () => {
      if (typeof window !== 'undefined' && (window as any).powerbi && showEmbed) {
        try {
          const container = document.getElementById('reportContainer');
          if (container) {
            const report = (window as any).powerbi.get(container);
            if (report) {
              const settings = await report.getSettings();
              const isVisible = settings.panes?.filters?.visible || false;
              setFilterPaneVisible(isVisible);
              console.log(`Synced filter pane state: ${isVisible}`);
            }
          }
        } catch (error) {
          // Ignore sync errors - this is just for visual state
        }
      }
    };

    // Delay sync to allow report to fully load
    const timeoutId = setTimeout(syncFilterPaneState, 2000);
    return () => clearTimeout(timeoutId);
  }, [showEmbed]);

  // Orientation-aware mobile check - switches to desktop layout in landscape
  function isMobileLike() {
    const touch = navigator.maxTouchPoints > 0;
    const currentWidth = window.innerWidth; // Use current width, not minimum dimension
    return touch && currentWidth <= 820;
  }

  // Desktop: toggle built-in pane. Mobile: show custom drawer.
  async function onFilterIconClick(report: any) {
    if (!report) {
      console.warn("No PowerBI report instance available");
      return;
    }

    // Use native PowerBI filters for both mobile and desktop
    try {
      if (!filterPaneVisible) {
        // Open filters
        await report.updateSettings({
          panes: { filters: { visible: true, expanded: true } }
        });
        console.log("Opened native Filters pane");
        setFilterPaneVisible(true);
      } else {
        // Close filters
        await report.updateSettings({
          panes: { filters: { visible: false } }
        });
        console.log("Closed native Filters pane");
        setFilterPaneVisible(false);
      }
    } catch (e) {
      console.warn("updateSettings failed:", e);
    }
  }

  // Example: apply a filter from custom mobile UI
  async function applyRegionFilter(report: any, regions: string[]) {
    const filter: models.IBasicFilter = {
      $schema: "http://powerbi.com/product/schema#basic",
      target: { table: "Sales", column: "Region" },
      operator: "In",
      values: regions,
      filterType: models.FilterType.Basic,
    };
    await report.setFilters([filter]); // or updateFilters(...)
  }
  
  // Authentication hooks
  const { isAuthenticated, isAuthenticating, authenticateAuto } = usePowerBIAuth();
  
  // Power BI API hooks
  const { data: workspaces, isLoading: loadingWorkspaces, error: workspacesError } = usePowerBIWorkspaces(isAuthenticated);
  const { data: allReports, isLoading: loadingReports, error: reportsError } = usePowerBIReports(isAuthenticated, selectedWorkspaceId);

  // Filter reports based on selected filter type
  const reports = allReports?.filter(report => {
    if (reportTypeFilter === "all") return true;
    
    const isStandardReport = report.name.trim().toLowerCase() === report.datasetName?.trim().toLowerCase();
    
    if (reportTypeFilter === "standard") return isStandardReport;
    if (reportTypeFilter === "custom") return !isStandardReport;
    
    return true;
  }) || [];

  // Clear selected report if it doesn't match current filter
  useEffect(() => {
    if (selectedReportId && allReports && allReports.length > 0) {
      const selectedReport = allReports.find(r => r.id === selectedReportId);
      if (selectedReport) {
        const isStandardReport = selectedReport.name.trim().toLowerCase() === selectedReport.datasetName?.trim().toLowerCase();
        
        const shouldClearSelection = 
          (reportTypeFilter === "standard" && !isStandardReport) ||
          (reportTypeFilter === "custom" && isStandardReport);
          
        if (shouldClearSelection) {
          setSelectedReportId("");
          setShowEmbed(false);
          setEmbedConfig(null);
        }
      }
    }
  }, [reportTypeFilter, selectedReportId, allReports]);
  
  const { 
    embedReport, 
    isLoading, 
    error, 
    refreshReport, 
    refreshDataset,
    cancelDatasetRefresh, // Add cancel function
    toggleFullscreen,
    switchToEditMode,
    switchToViewMode,
    saveAs,
    viewMode,
    currentAccessLevel,
    refreshInfo,
    resetRefreshState,
    // Page navigation functionality
    pages,
    currentPageId,
    switchToPage
  } = usePowerBIEmbed("reportContainer");
  
  const { 
    exportToPDF, 
    exportToPowerPoint, 
    exportToPNG, 
    isExporting, 
    exportProgress, 
    exportStatus 
  } = usePowerBIExport();
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  
  // Automatic authentication on component mount
  useEffect(() => {
    const autoConnect = async () => {
      try {
        await authenticateAuto();
        // Silent connection - no toast notification
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to connect automatically";
        console.error("Auto-authentication failed:", errorMessage);
        
        // Show detailed error message with helpful guidance
        const isExpiredSecret = errorMessage.includes("expired") || errorMessage.includes("7000222");
        toast({
          title: "Connection Failed",
          description: isExpiredSecret 
            ? "Your Azure app secret has expired. Please create a new client secret in Azure Portal and update POWERBI_APPLICATION_SECRET in Replit Secrets."
            : errorMessage,
          variant: "destructive",
        });
      }
    };
    
    // Only try to auto-connect if not already authenticated
    if (!isAuthenticated && !isAuthenticating) {
      autoConnect();
    }
  }, [authenticateAuto, isAuthenticated, isAuthenticating, toast]);

  // Auto-reset refresh state after completion (without toast notification)
  useEffect(() => {
    if (refreshInfo.status === 'completed' || refreshInfo.status === 'failed' || refreshInfo.status === 'cancelled') {
      setTimeout(() => {
        resetRefreshState();
      }, 5000); // Reset after 5 seconds
    }
  }, [refreshInfo.status, resetRefreshState]);

  // Cleanup timeouts on unmount to prevent race conditions
  useEffect(() => {
    return () => {
      if (embedTimeoutRef.current) {
        clearTimeout(embedTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
    };
  }, []);


  const handleWorkspaceSelect = (workspaceId: string) => {
    const workspace = workspaces?.find(w => w.id === workspaceId);
    if (workspace) {
      setSelectedWorkspaceId(workspaceId);
      setSelectedWorkspace(workspace);
      // Reset report selection when workspace changes
      setSelectedReportId("");
      setShowEmbed(false);
      setEmbedConfig(null);
    }
  };
  
  // Auto-load report when selected - with race condition protection
  const handleReportSelect = useCallback(async (reportId: string) => {
    // Clear any existing timeouts to prevent race conditions
    if (embedTimeoutRef.current) {
      clearTimeout(embedTimeoutRef.current);
      embedTimeoutRef.current = null;
    }
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Set current operation ID to prevent race conditions
    const operationId = `${reportId}-${Date.now()}`;
    currentOperationRef.current = operationId;

    setSelectedReportId(reportId);
    
    // Close mobile sidebar when report is selected
    if (showMobileSidebar) {
      setShowMobileSidebar(false);
    }
    
    if (!isAuthenticated || !selectedWorkspaceId || !reportId) {
      // Reset embed state when no report is selected
      setShowEmbed(false);
      setEmbedConfig(null);
      currentOperationRef.current = null;
      return;
    }

    try {
      // Reset embed state first to clean up any existing report
      setShowEmbed(false);
      setEmbedConfig(null);
      
      // Small delay to ensure cleanup, then show loading state
      embedTimeoutRef.current = setTimeout(() => {
        // Check if this operation is still current
        if (currentOperationRef.current !== operationId) {
          return; // Operation was superseded, abort
        }
        
        setShowEmbed(true);
        setEmbedConfig({ reportId, workspaceId: selectedWorkspaceId } as any);
        
        // Additional delay to ensure DOM is ready, then embed
        loadTimeoutRef.current = setTimeout(async () => {
          // Double-check operation is still current
          if (currentOperationRef.current !== operationId) {
            return; // Operation was superseded, abort
          }

          try {
            const config = await embedReport({ 
              workspaceId: selectedWorkspaceId, 
              reportId 
            } as any);
            
            // Final check before setting config
            if (currentOperationRef.current === operationId) {
              setEmbedConfig(config);
            }
          } catch (embedError) {
            // Only handle error if operation is still current
            if (currentOperationRef.current === operationId) {
              console.error("Embed error:", embedError);
              setShowEmbed(false);
              setEmbedConfig(null);
              toast({
                title: "Embed Failed",
                description: embedError instanceof Error ? embedError.message : "Failed to embed report",
                variant: "destructive",
              });
            }
          } finally {
            // Clear operation if it's still current
            if (currentOperationRef.current === operationId) {
              currentOperationRef.current = null;
            }
          }
        }, 150);
      }, 50);
      
    } catch (error) {
      // Only handle error if operation is still current
      if (currentOperationRef.current === operationId) {
        setShowEmbed(false);
        setEmbedConfig(null);
        toast({
          title: "Failed to Load Report",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
        currentOperationRef.current = null;
      }
    }
  }, [isAuthenticated, selectedWorkspaceId, embedReport, showMobileSidebar, toast]);

  // Handle orientation changes to switch between mobile/desktop layouts with proper debouncing
  useEffect(() => {
    const handleOrientationChange = () => {
      // Clear any existing orientation timeout to prevent multiple rapid calls
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }

      // Close mobile sidebar when orientation changes to prevent layout issues
      if (showMobileSidebar) {
        setShowMobileSidebar(false);
      }
      
      // Debounced re-embed with proper race condition protection
      orientationTimeoutRef.current = setTimeout(async () => {
        // Only proceed if we have a report currently loaded
        if (!showEmbed || !embedConfig || !selectedWorkspaceId || !selectedReportId) {
          return;
        }

        // Check if there's already an operation in progress - if so, skip
        if (currentOperationRef.current !== null) {
          console.log('🔄 Skipping orientation re-embed - operation already in progress');
          return;
        }

        console.log('🔄 Orientation changed, re-embedding report with new layout...');
        try {
          // Use the existing race-condition protected handleReportSelect function
          // This ensures proper cleanup and prevents conflicts
          await handleReportSelect(selectedReportId);
          console.log('✅ Report re-embedded successfully with new orientation layout');
        } catch (error) {
          console.error('❌ Failed to re-embed report after orientation change:', error);
          // Don't show toast error for orientation changes as it's not critical
        } finally {
          orientationTimeoutRef.current = null;
        }
      }, 500); // Longer debounce delay to ensure orientation change is fully complete
    };

    // Use only resize event - it's more reliable and fires after orientation is complete
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
    };
  }, [showMobileSidebar, showEmbed, embedConfig, selectedWorkspaceId, selectedReportId, handleReportSelect]);


  return (
    <div className="h-screen bg-background flex flex-col" data-testid="dashboard-page">
      {/* Header with Workspace Selector */}
      <header className="flex items-center justify-between py-2 pl-2 pr-4 border-b">
        <div className="flex items-center space-x-0.5">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <ChartBar className="w-4 h-4 text-black" />
          </div>
          <h1 className="font-bold text-foreground whitespace-nowrap text-[16px]">Power BI Reports</h1>
        </div>
        
        {/* Workspace Selector in Top Right */}
        {(isAuthenticated || isAuthenticating) && (
          <div className="w-48 md:w-80 ml-8">
            <Combobox
              options={workspaces?.map(w => ({ value: w.id, label: w.name })) || []}
              value={selectedWorkspaceId}
              onValueChange={handleWorkspaceSelect}
              placeholder={
                isAuthenticating ? "Connecting..." :
                loadingWorkspaces ? "Loading workspaces..." :
                workspacesError ? "Error loading workspaces" :
                "Select workspace..."
              }
              searchPlaceholder="Type to search workspaces..."
              disabled={isAuthenticating || loadingWorkspaces}
              data-testid="combobox-workspace"
              className="text-sm"
            />
          </div>
        )}
      </header>
      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Report Selection - Minimizable */}
        {selectedWorkspace && (() => {
          // Auto-hide sidebar on mobile when a report is selected, unless mobile sidebar is explicitly shown
          const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
          const shouldHideOnMobile = isMobile && selectedReportId && showEmbed && !showMobileSidebar;
          return !shouldHideOnMobile;
        })() && (
          <div className={`${
            // Mobile overlay vs desktop sidebar
            showMobileSidebar ? 'fixed inset-0 z-50 bg-background' : 
            `${sidebarMinimized ? 'w-16' : 'w-80'} bg-background border-r border-border`
          } transition-all duration-300 flex flex-col h-full`}>
            <div className="pt-0 pr-4 pb-4 pl-4">
              {/* Header with Close button for mobile overlay or Minimize Toggle for desktop */}
              <div className="flex items-center justify-between mb-4 mt-3">
                {!sidebarMinimized && (
                  <h2 className="font-semibold text-foreground text-[16px]">Select Report</h2>
                )}
                {showMobileSidebar ? (
                  // Close button for mobile overlay
                  (<Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMobileSidebar(false)}
                    className="h-8 w-8"
                    data-testid="button-close-mobile-sidebar"
                  >
                    <X className="w-4 h-4" />
                  </Button>)
                ) : (
                  // Minimize toggle for desktop
                  (<Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarMinimized(!sidebarMinimized)}
                    className="h-8 w-8"
                    data-testid="button-toggle-sidebar"
                  >
                    {sidebarMinimized ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </Button>)
                )}
              </div>
              
              {!sidebarMinimized ? (
                <Card className="p-4">
                  <div className="space-y-3">
                    {/* Report Type Filter - only show when authenticated and have reports */}
                    {isAuthenticated && allReports && allReports.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          Report Type
                        </Label>
                        <Tabs
                          value={reportTypeFilter}
                          onValueChange={(value) => {
                            // Ensure we always have a valid filter value
                            const newValue = (value as "all" | "standard" | "custom") || "all";
                            if (newValue !== reportTypeFilter) {
                              setReportTypeFilter(newValue);
                              // Reset selected report when filter changes
                              if (selectedReportId) {
                                setSelectedReportId("");
                                setShowEmbed(false);
                                setEmbedConfig(null);
                              }
                            }
                          }}
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-3 h-auto p-0 bg-transparent">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TabsTrigger
                                  value="all"
                                  className="flex items-center gap-1.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2 min-h-10 transition-all duration-200"
                                  style={{
                                    borderBottom: reportTypeFilter === "all" ? "2px solid black" : "2px solid transparent"
                                  }}
                                  data-testid="button-filter-all"
                                >
                                  <ReportTypeMark type="all" showLabel={false} />
                                  <span>All</span>
                                </TabsTrigger>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white border border-gray-200 text-black shadow-md">
                                <p>{allReports.length}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TabsTrigger
                                  value="standard"
                                  className="flex items-center gap-1.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2 min-h-10 transition-all duration-200"
                                  style={{
                                    borderBottom: reportTypeFilter === "standard" ? "2px solid black" : "2px solid transparent"
                                  }}
                                  data-testid="button-filter-standard"
                                >
                                  <ReportTypeMark type="standard" showLabel={false} />
                                  <span>Standard</span>
                                </TabsTrigger>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white border border-gray-200 text-black shadow-md">
                                <p>{allReports.filter(r => r.name.trim().toLowerCase() === r.datasetName?.trim().toLowerCase()).length}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TabsTrigger
                                  value="custom"
                                  className="flex items-center gap-1.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2 min-h-10 transition-all duration-200"
                                  style={{
                                    borderBottom: reportTypeFilter === "custom" ? "2px solid black" : "2px solid transparent"
                                  }}
                                  data-testid="button-filter-custom"
                                >
                                  <ReportTypeMark type="custom" showLabel={false} />
                                  <span>Custom</span>
                                </TabsTrigger>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white border border-gray-200 text-black shadow-md">
                                <p>{allReports.filter(r => r.name.trim().toLowerCase() !== r.datasetName?.trim().toLowerCase()).length}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TabsList>
                        </Tabs>
                      </div>
                    )}

                    {/* Report Selection - only show when authenticated */}
                    {isAuthenticated && (
                      <div className="space-y-1">
                        <Label className="text-sm">Report</Label>
                        <Combobox
                          options={reports?.map(r => {
                            const isStandardReport = r.name.trim().toLowerCase() === r.datasetName?.trim().toLowerCase();
                            const reportType = isStandardReport ? 'standard' : 'custom';
                            return {
                              value: r.id,
                              label: r.name,
                              icon: <ReportTypeMark type={reportType} showLabel={false} />
                            };
                          }) || []}
                          value={selectedReportId}
                          onValueChange={handleReportSelect}
                          placeholder={
                            loadingReports ? "Loading reports..." :
                            reportsError ? "Error loading reports" :
                            reports?.length === 0 ? 
                              (reportTypeFilter === "all" ? "No reports found in this workspace" :
                               reportTypeFilter === "standard" ? "No standard reports found" :
                               "No custom reports found") :
                            "Search reports..."
                          }
                          searchPlaceholder="Type to search reports..."
                          disabled={loadingReports || !isAuthenticated}
                          data-testid="combobox-report"
                          className="text-sm"
                        />
                        {reportsError && (
                          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-md">
                            <div className="font-medium">Failed to load reports</div>
                            <div>Please check your connection and try again.</div>
                          </div>
                        )}
                        {isAuthenticated && reports?.length === 0 && !loadingReports && !reportsError && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                            <div className="font-medium">
                              {reportTypeFilter === "all" ? "No reports found" :
                               reportTypeFilter === "standard" ? "No standard reports found" :
                               "No custom reports found"}
                            </div>
                            <div>
                              {reportTypeFilter === "all" ? "This workspace doesn't contain any reports yet." :
                               reportTypeFilter === "standard" ? "No reports match the dataset name in this workspace." :
                               "No reports with different names from their datasets found."}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-md">
                        {typeof error === 'string' ? error : "An error occurred"}
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                /* Vertical text when sidebar is minimized */
                (<div className="flex-1 flex items-center justify-center py-8">
                  <div 
                    className="text-sm font-semibold text-muted-foreground whitespace-nowrap"
                    style={{ 
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center center',
                      width: '120px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Select Report
                  </div>
                </div>)
              )}
            </div>
          </div>
        )}
        
        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {showEmbed && embedConfig ? (
            <div className="flex-1 min-h-0 pt-0 pr-0 pb-4 pl-0 sm:pt-0 sm:pr-0 sm:pb-2 sm:pl-0 md:pt-0 md:pr-1 md:pb-4 md:pl-4 overflow-hidden md:overflow-auto">
              <PowerBIEmbed
                className="w-full h-full"
                reportName={allReports?.find(r => r.id === selectedReportId)?.name}
                workspaceId={selectedWorkspaceId}
                datasetId={allReports?.find(r => r.id === selectedReportId)?.datasetId}
                isAuthenticated={isAuthenticated}
                viewMode={viewMode}
                pages={pages}
                currentPageId={currentPageId}
                onPageChange={switchToPage}
                showMobileBackButton={(() => {
                  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
                  return isMobile && !!selectedReportId && !!selectedWorkspace;
                })()}
                onMobileBackClick={() => {
                  // Clear report selection and unhide the original sidebar
                  setSelectedReportId("");
                  setShowEmbed(false);
                  setEmbedConfig(null);
                }}
              />
            </div>
          ) : selectedWorkspace ? (
            <div className="flex-1 flex justify-center p-4">
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground max-w-md">
                {workspacesError && (
                  <div className="mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                    <div className="font-medium">Failed to load workspaces</div>
                    <div>Please check your connection and try again.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Floating Refresh Status Card - Bottom Right during and after refresh */}
      {(refreshInfo.status === 'refreshing' || refreshInfo.status === 'completed' || refreshInfo.status === 'failed' || refreshInfo.status === 'cancelling' || refreshInfo.status === 'cancelled') && (
        <div className="fixed bottom-20 right-6 z-40 max-w-md" data-testid="floating-refresh-status">
          <RefreshStopwatch 
            refreshInfo={refreshInfo} 
            onCancel={cancelDatasetRefresh}
            onDismiss={() => resetRefreshState()}
            className="bg-background/95 backdrop-blur-sm border shadow-lg"
          />
        </div>
      )}
      {/* Floating Export Status Card - Bottom Right during export */}
      {isExporting && (
        <div className="fixed bottom-6 right-6 z-40 max-w-md" data-testid="floating-export-status">
          <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-foreground">
                      Exporting Report
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {exportStatus || 'Processing...'}
                    </div>
                  </div>
                </div>
              </div>
              {exportProgress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      {/* Floating Back to Reports Button - Above Settings */}
      {(() => {
        const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        return showEmbed && embedConfig && !isLoading && isMobile && selectedReportId && selectedWorkspace;
      })() && (
        <div className="fixed bottom-44 left-2 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // Clear report selection and unhide the original sidebar
              setSelectedReportId("");
              setShowEmbed(false);
              setEmbedConfig(null);
            }}
            className="h-10 w-10 rounded-full shadow-lg bg-white border-border hover:shadow-xl text-muted-foreground hover:text-foreground"
            data-testid="button-floating-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
      {/* Floating Filters Button - Third in Line */}
      {(() => {
        const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        return showEmbed && embedConfig && !isLoading && isMobile && selectedReportId && selectedWorkspace;
      })() && (
        <div className="fixed bottom-32 left-2 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              if (typeof window !== 'undefined' && (window as any).powerbi) {
                try {
                  // Check if reportContainer element exists
                  const container = document.getElementById('reportContainer');
                  if (!container) {
                    console.warn("PowerBI container element not found");
                    return;
                  }

                  const report = (window as any).powerbi.get(container);
                  await onFilterIconClick(report);
                } catch (error) {
                  console.error("Failed to get PowerBI report instance:", error);
                  
                  // Fallback to mobile drawer if desktop filter fails
                  if (isMobileLike()) {
                    setShowMobileFilterDrawer(true);
                  } else {
                    console.warn("Desktop filter pane failed, report may not be loaded yet");
                  }
                }
              }
            }}
            className={`h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-colors ${
              filterPaneVisible 
                ? 'text-white' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}
            style={filterPaneVisible ? { 
              backgroundColor: '#0E94D2', 
              borderColor: '#0E94D2' 
            } : {}}
            data-testid="button-filters"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      )}
      {/* Floating Settings Button - Bottom Left */}
      {showEmbed && embedConfig && !isLoading && (
        <div className="fixed bottom-20 md:bottom-4 left-2 z-50">
          <DropdownMenu onOpenChange={setSettingsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-colors ${
                  settingsDropdownOpen 
                    ? 'text-white' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                style={settingsDropdownOpen ? { 
                  backgroundColor: '#0E94D2', 
                  borderColor: '#0E94D2' 
                } : {}}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="mb-2 bg-white border border-gray-200">
              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    await refreshReport();
                    toast({
                      title: "Report Refreshed",
                      description: "The report data has been refreshed",
                    });
                  } catch (error) {
                    toast({
                      title: "Refresh Failed",
                      description: error instanceof Error ? error.message : "Failed to refresh report",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="menu-refresh"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh Report
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    await refreshDataset();
                    // Note: No toast here - the new stopwatch system handles notifications
                  } catch (error) {
                    // No toast notification - RefreshStopwatch component handles error display
                    console.error("Dataset refresh initiation failed:", error);
                  }
                }}
                disabled={refreshInfo.status === 'refreshing'}
                data-testid="menu-refresh-dataset"
                className="flex items-center gap-2"
              >
                {refreshInfo.status === 'refreshing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {refreshInfo.status === 'refreshing' ? 'Refreshing...' : 'Refresh Dataset'}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  try {
                    toggleFullscreen();
                    toast({
                      title: "Fullscreen Toggled",
                      description: "Report view mode changed",
                    });
                  } catch (error) {
                    toast({
                      title: "Fullscreen Failed",
                      description: error instanceof Error ? error.message : "Failed to toggle fullscreen",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="menu-fullscreen"
                className="flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Toggle Fullscreen
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    await switchToEditMode();
                    toast({
                      title: "Edit Mode Enabled",
                      description: "You can now edit the report",
                    });
                  } catch (error) {
                    console.error("Edit mode error:", error);
                    let errorMessage = "Failed to switch to edit mode";
                    
                    if (error && typeof error === 'object' && 'message' in error) {
                      const errorObj = error as any;
                      if (errorObj.message === 'insufficientPermissions' || errorObj.detailedMessage?.includes('insufficient Permissions')) {
                        errorMessage = "You don't have permission to edit this report. Contact your Power BI admin to request edit access.";
                      } else {
                        errorMessage = errorObj.detailedMessage || errorObj.message || errorMessage;
                      }
                    }
                    
                    toast({
                      title: "Edit Mode Unavailable",
                      description: errorMessage,
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="menu-edit-mode"
                className="flex items-center gap-2"
                disabled={isMobile || viewMode === "edit"}
              >
                <Edit className="w-4 h-4" />
                Switch to Edit
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    await switchToViewMode();
                    toast({
                      title: "View Mode Enabled",
                      description: "Switched back to view mode",
                    });
                  } catch (error) {
                    toast({
                      title: "Switch to View Failed",
                      description: error instanceof Error ? error.message : "Failed to switch to view mode",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="menu-view-mode"
                className="flex items-center gap-2"
                disabled={viewMode === "view"}
              >
                <Eye className="w-4 h-4" />
                Switch to View
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={async () => {
                  if (!selectedWorkspaceId || !selectedReportId) {
                    toast({
                      title: "Export Failed",
                      description: "No report selected for export",
                      variant: "destructive",
                    });
                    return;
                  }

                  const selectedReport = allReports?.find(r => r.id === selectedReportId);
                  const reportName = selectedReport?.name || 'report';

                  try {
                    // Default to PDF export for now - can be extended with format selection
                    await exportToPDF(selectedWorkspaceId, selectedReportId, reportName);
                  } catch (error) {
                    console.error("Export error:", error);
                    toast({
                      title: "Export Failed",
                      description: error instanceof Error ? error.message : "Failed to export report",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="menu-export-file"
                className="flex items-center gap-2"
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export Report to File'}
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {/* Mobile Filter Drawer */}
      <Sheet open={showMobileFilterDrawer} onOpenChange={setShowMobileFilterDrawer}>
        <SheetContent side="bottom" className="h-[80vh] bg-white">
          <SheetHeader>
            <SheetTitle>Report Filters</SheetTitle>
            <SheetDescription>
              Apply filters to customize your report data
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              Custom filter interface will be implemented here.
            </div>
            
            {/* Example region filter */}
            <Button 
              onClick={async () => {
                if (typeof window !== 'undefined' && (window as any).powerbi) {
                  try {
                    const container = document.getElementById('reportContainer');
                    if (!container) {
                      console.warn("PowerBI container element not found");
                      return;
                    }

                    const report = (window as any).powerbi.get(container);
                    if (report) {
                      await applyRegionFilter(report, ["West", "South"]);
                      console.log('Applied region filter: West, South');
                      setShowMobileFilterDrawer(false);
                    }
                  } catch (error) {
                    console.error('Failed to apply filter:', error);
                  }
                }
              }}
              className="w-full"
            >
              Apply Region Filter (West, South)
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                setShowMobileFilterDrawer(false);
                // Reset visual feedback state when drawer closes
                setFilterPaneVisible(false);
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
