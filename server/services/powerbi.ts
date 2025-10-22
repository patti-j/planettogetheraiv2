import { type PowerBIToken, type ReportEmbedConfig } from "@shared/schema";

export interface PowerBIEmbedToken {
  accessToken: string;
  tokenId: string;
  expiration: string;
}

export interface PowerBIWorkspace {
  id: string;
  name: string;
  isReadOnly: boolean;
  isOnDedicatedCapacity: boolean;
}

export interface PowerBIReportSummary {
  id: string;
  name: string;
  embedUrl: string;
  workspaceId: string;
  datasetId: string;
  datasetName: string;
}

export interface PowerBIDataset {
  id: string;
  name: string;
  isRefreshable: boolean;
  isEffectiveIdentityRequired: boolean;
  isOnPremGatewayRequired: boolean;
  storageMode: "Import" | "Direct Query" | "LiveConnection" | "Composite" | "Unknown";
}

export interface PowerBITable {
  name: string;
  isHidden: boolean;
  source?: any[];
}

export interface PowerBIDataSource {
  datasourceType: string;
  connectionDetails: {
    server?: string;
    database?: string;
  };
}

export interface ServicePrincipalAuth {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

// Types for refresh duration estimation
export interface RefreshHistoryEntry {
  refreshType: string;
  startTime: string;
  endTime: string;
  status: "Completed" | "Failed" | "In Progress" | "Cancelled";
  refreshDurationSeconds: number; // calculated from startTime and endTime
}

export interface RefreshEstimate {
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
}

export class PowerBIService {
  // Hardcoded dataset storage mode mappings - edit this to set your dataset storage modes
  private readonly HARDCODED_STORAGE_MODES: Record<string, "Import" | "Direct Query" | "LiveConnection" | "Composite"> = {
    // Direct Query datasets
    "DispatchList": "Direct Query",
    "Production&Planning": "Direct Query", 
    "HistoricalKPIs": "Direct Query",
    "CapacityPlan": "Direct Query",  
    "Finance": "Direct Query",
    "PurchaseOrders": "Direct Query",
    
    // Mixed/Composite datasets
    "AuditLog": "Composite",  // Partially Direct Query = Mixed/Composite
    
    // All other datasets will default to "Import" mode via fallback logic
  };

  constructor() {
    // Simple service - no complex config needed
  }

  // Get report from specific workspace
  async getReport(accessToken: string, workspaceId: string, reportId: string): Promise<any> {
    const reportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;

    try {
      const response = await fetch(reportUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get report: ${error}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get embed token for a report (supports both regular and paginated reports)
  async getEmbedToken(
    accessToken: string, 
    workspaceId: string, 
    reportId: string, 
    datasetId?: string, 
    accessLevel: string = "View", 
    allowSaveAs?: boolean,
    reportType?: string
  ): Promise<PowerBIEmbedToken> {
    const embedUrl = `https://api.powerbi.com/v1.0/myorg/GenerateToken`;
    
    // Build reports array entry
    const reportEntry: any = {
      id: reportId,
      allowEdit: accessLevel === "Edit", // Critical for edit mode support!
      allowSaveAs: accessLevel === "Edit" || allowSaveAs || false,
    };
    
    // For paginated reports, include reportType field per Microsoft's app-owns-data guide
    if (reportType === 'PaginatedReport') {
      reportEntry.reportType = 'PaginatedReport';
    }
    
    const requestBody: any = {
      reports: [reportEntry],
      targetWorkspaces: [
        {
          id: workspaceId, // Critical for Save As functionality - must include target workspace
        },
      ],
      accessLevel: accessLevel,
    };

    // Handle datasets for both regular and paginated reports
    if (reportType === 'PaginatedReport') {
      // Paginated reports: always include datasets array per Power BI GenerateToken requirements
      if (datasetId) {
        // Paginated report using a Power BI semantic model - include datasets with xmlaPermissions
        console.log(`📊 Paginated report uses semantic model ${datasetId} - adding xmlaPermissions`);
        requestBody.datasets = [
          {
            id: datasetId,
            xmlaPermissions: "ReadOnly",
            allowEdit: false,
          },
        ];
      } else {
        // Paginated report with external data sources - include empty datasets array
        // Power BI API may require this even when no semantic model is used
        console.log(`📊 Paginated report uses external data sources - including empty datasets array`);
        requestBody.datasets = [];
      }
    } else {
      // Regular PBIX reports always need dataset permissions
      if (datasetId) {
        requestBody.datasets = [
          {
            id: datasetId,
            permissions: accessLevel === "Edit" ? ["ReadWrite"] : ["Read"],
          },
        ];
      } else {
        console.warn(`⚠️ Regular report ${reportId} missing datasetId - token generation may fail`);
      }
    }

    try {
      const response = await fetch(embedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get embed token: ${error}`);
      }

      const embedData = await response.json();
      return {
        accessToken: embedData.token,
        tokenId: embedData.tokenId,
        expiration: embedData.expiration,
      };
    } catch (error) {
      throw new Error(`Failed to get embed token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get reports from Power BI service
  async getReports(accessToken: string): Promise<any[]> {
    const reportsUrl = "https://api.powerbi.com/v1.0/myorg/reports";

    try {
      const response = await fetch(reportsUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get reports: ${error}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      throw new Error(`Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get workspaces from Power BI service
  async getWorkspaces(accessToken: string): Promise<PowerBIWorkspace[]> {
    const workspacesUrl = "https://api.powerbi.com/v1.0/myorg/groups";

    try {
      const response = await fetch(workspacesUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get workspaces: ${error}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      throw new Error(`Failed to fetch workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get reports from a specific workspace with dataset names
  async getReportsFromWorkspace(accessToken: string, workspaceId: string): Promise<PowerBIReportSummary[]> {
    const reportsUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports`;

    try {
      const response = await fetch(reportsUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get reports from workspace: ${error}`);
      }

      const data = await response.json();
      const reports = data.value || [];

      // Fetch dataset information for each report concurrently
      const reportsWithDatasetNames = await Promise.all(
        reports.map(async (report: any) => {
          let datasetName = 'Unknown Dataset'; // Fallback value
          
          try {
            if (report.datasetId) {
              const dataset = await this.getDataset(accessToken, workspaceId, report.datasetId);
              datasetName = dataset.name;
            }
          } catch (datasetError) {
            console.warn(`Warning: Could not fetch dataset name for report ${report.name} (${report.id}), using fallback:`, datasetError);
            // Keep fallback value 'Unknown Dataset'
          }

          return {
            id: report.id,
            name: report.name,
            embedUrl: report.embedUrl,
            workspaceId: workspaceId,
            datasetId: report.datasetId,
            datasetName: datasetName,
            reportType: report.reportType || report.type || 'Report' // Include report type (Report or PaginatedReport)
          };
        })
      );

      return reportsWithDatasetNames;
    } catch (error) {
      throw new Error(`Failed to fetch reports from workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Authenticate with service principal and get access token
  async authenticateServicePrincipal(clientId: string, clientSecret: string, tenantId: string): Promise<string> {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to authenticate service principal: ${error}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new Error(`Failed to authenticate service principal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get dataset information
  async getDataset(accessToken: string, workspaceId: string, datasetId: string): Promise<PowerBIDataset> {
    const datasetUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}`;

    try {
      const response = await fetch(datasetUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get dataset: ${error}`);
      }

      const dataset = await response.json();
      
      // Determine storage mode by analyzing dataset properties
      const storageMode = await this.determineStorageMode(accessToken, workspaceId, datasetId, dataset);

      return {
        id: dataset.id,
        name: dataset.name,
        isRefreshable: dataset.isRefreshable,
        isEffectiveIdentityRequired: dataset.isEffectiveIdentityRequired,
        isOnPremGatewayRequired: dataset.isOnPremGatewayRequired,
        storageMode,
      };
    } catch (error) {
      throw new Error(`Failed to fetch dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Trigger dataset refresh - returns refreshId and estimation for progress tracking
  async triggerDatasetRefresh(accessToken: string, workspaceId: string, datasetId: string): Promise<{refreshId?: string, estimation?: any}> {
    const refreshUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`;

    try {
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "Full"  // Full refresh of the dataset
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to trigger dataset refresh: ${error}`);
      }

      // Get refresh history and dataset info for estimation
      let refreshId: string | undefined;
      let estimation: any = undefined;
      
      try {
        // Wait a moment for the refresh to be created, then get the latest refresh
        await new Promise(resolve => setTimeout(resolve, 500));
        const [refreshHistory, datasetInfo] = await Promise.all([
          this.getDatasetRefreshHistory(accessToken, workspaceId, datasetId),
          this.getDataset(accessToken, workspaceId, datasetId)
        ]);
        
        // Get the most recent refresh (should be the one we just triggered)
        if (refreshHistory && refreshHistory.length > 0) {
          const latestRefresh = refreshHistory.sort((a, b) => 
            new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
          )[0];
          
          refreshId = latestRefresh.requestId || latestRefresh.id;
          
          // Calculate estimation from historical data
          estimation = this.calculateRefreshEstimation(refreshHistory, datasetInfo);
        }
      } catch (historyError) {
        console.warn(`Warning: Could not retrieve refreshId or estimation:`, historyError);
        // Don't fail the entire refresh operation if we can't get the ID
      }

      console.log(`✅ Dataset refresh initiated for dataset ${datasetId} in workspace ${workspaceId}`, refreshId ? `(refreshId: ${refreshId})` : '(refreshId not available)');
      
      return { refreshId, estimation };
    } catch (error) {
      throw new Error(`Failed to trigger dataset refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate refresh estimation from historical data
  private calculateRefreshEstimation(refreshHistory: any[], datasetInfo: any) {
    // Filter completed refreshes only
    const completedRefreshes = refreshHistory.filter((r: any) => 
      r.status === 'Completed' && r.startTime && r.endTime
    );

    if (completedRefreshes.length === 0) {
      // No historical data - provide conservative estimate
      return {
        estimateRangeSeconds: { min: 5, max: 60, median: 30 },
        confidenceLevel: "low",
        historicalDataPoints: 0,
        averageDurationSeconds: 30,
        contextualFactors: {
          storageMode: datasetInfo?.storageMode || "Unknown",
          isLargeDataset: false,
          isPeakHour: false,
          recentFailures: false
        },
        message: "No historical data available - estimated 30 seconds"
      };
    }

    // Only use refreshes from the last 30 days for more accurate, recent-based estimation
    const currentTime = new Date();
    const thirtyDaysAgo = new Date(currentTime.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const last30DaysRefreshes = completedRefreshes
      .filter((r: any) => new Date(r.startTime) >= thirtyDaysAgo)
      .sort((a: any, b: any) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

    // Filter by refreshType to exclude scheduled refreshes with queue time
    // Only use OnDemand, ViaApi, ViaEnhancedApi for net processing time
    const onDemandTypes = ['OnDemand', 'ViaApi', 'ViaEnhancedApi'];
    const onDemandRefreshes = last30DaysRefreshes.filter((r: any) => 
      r.refreshType && onDemandTypes.includes(r.refreshType)
    );

    // Calculate durations for each refresh type
    const allRefreshesWithDurations = last30DaysRefreshes.map((r: any) => ({
      ...r,
      duration: (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 1000
    }));

    const onDemandDurations = onDemandRefreshes.map((r: any) => ({
      type: r.refreshType,
      duration: (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 1000
    }));

    // Use on-demand refreshes if we have ANY, otherwise fall back to all
    // On-demand refreshes give us net processing time without queue wait
    const refreshesToUse = onDemandRefreshes.length > 0 ? onDemandRefreshes : last30DaysRefreshes;

    // Debug logging to understand refresh types
    console.log(`📊 Refresh Type Analysis (Last 30 Days):`, {
      total: last30DaysRefreshes.length,
      onDemand: onDemandRefreshes.length,
      scheduled: last30DaysRefreshes.filter((r: any) => r.refreshType === 'Scheduled').length,
      usingOnDemandOnly: onDemandRefreshes.length > 0,
      onDemandDurations: onDemandDurations.map(d => `${d.type}: ${d.duration}s`).join(', '),
      allTypes: allRefreshesWithDurations.map(r => `${r.refreshType || 'Unknown'}: ${r.duration}s`).join(' | ')
    });

    // Calculate durations from recent historical data
    const durations = refreshesToUse.map((r: any) => {
      const start = new Date(r.startTime).getTime();
      const end = new Date(r.endTime).getTime();
      return (end - start) / 1000; // seconds
    }).sort((a: number, b: number) => a - b);

    const count = durations.length;
    const sum = durations.reduce((a: number, b: number) => a + b, 0);
    const average = sum / count;
    const median = count % 2 === 0 
      ? (durations[count / 2 - 1] + durations[count / 2]) / 2
      : durations[Math.floor(count / 2)];
    
    // P80 (80th percentile)
    const p80Index = Math.floor(count * 0.8);
    const p80 = durations[Math.min(p80Index, count - 1)];

    // Min/Max from historical data
    const min = Math.max(5, durations[0]); // At least 5 seconds
    const max = p80; // Use P80 as max to avoid outliers

    // Determine confidence level
    let confidenceLevel: "low" | "medium" | "high";
    if (count >= 10) confidenceLevel = "high";
    else if (count >= 5) confidenceLevel = "medium";
    else confidenceLevel = "low";

    // Check for contextual factors
    const isLargeDataset = datasetInfo?.storageMode === "Import" && average > 120; // >2 min suggests large
    
    const recentRefreshes = refreshHistory.slice(0, 5);
    const recentFailures = recentRefreshes.filter((r: any) => r.status === 'Failed').length > 1;

    // Add 20% to compensate for polling interval (4s) + API response time + Power BI status propagation lag
    const DETECTION_LAG_MULTIPLIER = 1.20;
    const adjustedMedian = median * DETECTION_LAG_MULTIPLIER;
    const adjustedMin = min * DETECTION_LAG_MULTIPLIER;
    const adjustedMax = p80 * DETECTION_LAG_MULTIPLIER;

    // Generate base contextual message (peak hours shown dynamically on frontend when remaining = 0)
    let message = `Estimated ${Math.round(adjustedMedian)} seconds based on historical refreshes`;
    if (isLargeDataset) message += " (large dataset)";
    if (recentFailures) message += " (recent failures detected)";

    return {
      estimateRangeSeconds: {
        min: Math.round(adjustedMin),
        max: Math.round(adjustedMax),
        median: Math.round(adjustedMedian)
      },
      confidenceLevel,
      historicalDataPoints: count,
      averageDurationSeconds: Math.round(adjustedMedian), // Use median instead of average - more resistant to outliers
      contextualFactors: {
        storageMode: datasetInfo?.storageMode || "Unknown",
        isLargeDataset,
        recentFailures
      },
      message
    };
  }

  // Initiate dataset refresh
  async refreshDataset(accessToken: string, workspaceId: string, datasetId: string): Promise<void> {
    const refreshUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`;

    try {
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifyOption: "NoNotification"
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to initiate dataset refresh: ${error}`);
      }

      console.log(`✅ Dataset refresh initiated for dataset ${datasetId} in workspace ${workspaceId}`);
    } catch (error) {
      throw new Error(`Failed to initiate dataset refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cancel dataset refresh
  async cancelDatasetRefresh(accessToken: string, workspaceId: string, datasetId: string, refreshId: string): Promise<void> {
    const cancelUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes/${refreshId}`;

    try {
      const response = await fetch(cancelUrl, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to cancel dataset refresh: ${error}`);
      }

      console.log(`✅ Dataset refresh cancelled for dataset ${datasetId} in workspace ${workspaceId} (refreshId: ${refreshId})`);
    } catch (error) {
      throw new Error(`Failed to cancel dataset refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get dataset refresh history and status
  async getDatasetRefreshHistory(accessToken: string, workspaceId: string, datasetId: string): Promise<any[]> {
    const refreshHistoryUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`;

    try {
      const response = await fetch(refreshHistoryUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get dataset refresh history: ${error}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      throw new Error(`Failed to fetch dataset refresh history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get report data sources (for paginated reports) and extract dataset ID
  async getReportDataSources(accessToken: string, workspaceId: string, reportId: string): Promise<string | null> {
    const dataSourcesUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/datasources`;

    try {
      const response = await fetch(dataSourcesUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn(`⚠️ Could not fetch report datasources: ${error}`);
        return null;
      }

      const data = await response.json();
      const datasources = data.value || [];
      
      console.log(`📊 Found ${datasources.length} datasources for report ${reportId}:`, JSON.stringify(datasources, null, 2));
      
      // Look for a Power BI dataset datasource
      // The datasource might have datasourceType: 'PowerBIDataset' or contain dataset info
      for (const ds of datasources) {
        // Check if this is a PowerBIDataset type
        if (ds.datasourceType === 'PowerBIDataset' && ds.datasourceId) {
          console.log(`✅ Found Power BI dataset ID from datasourceType: ${ds.datasourceId}`);
          return ds.datasourceId;
        }
        
        // Check connectionDetails for dataset reference
        if (ds.connectionDetails) {
          // Sometimes the dataset info is in the connection string or details
          const details = typeof ds.connectionDetails === 'string' 
            ? ds.connectionDetails 
            : JSON.stringify(ds.connectionDetails);
          
          // Look for dataset GUID pattern in connection details
          const datasetMatch = details.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (datasetMatch) {
            console.log(`✅ Found potential dataset ID in connectionDetails: ${datasetMatch[0]}`);
            return datasetMatch[0];
          }
        }
      }
      
      console.log(`ℹ️ No Power BI dataset found in datasources - report uses external data sources`);
      return null;
    } catch (error) {
      console.warn(`⚠️ Error fetching report datasources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  // Get dataset data sources
  async getDatasetDataSources(accessToken: string, workspaceId: string, datasetId: string): Promise<PowerBIDataSource[]> {
    const dataSourcesUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/datasources`;

    try {
      const response = await fetch(dataSourcesUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get data sources: ${error}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      throw new Error(`Failed to fetch data sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get table storage modes using DAX query
  async getTableStorageModes(accessToken: string, workspaceId: string, datasetId: string): Promise<any[]> {
    const queryUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;

    try {
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queries: [{
            query: "EVALUATE INFO.PARTITIONS()"
          }],
          serializerSettings: {
            includeNulls: true
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to execute DAX query: ${error}`);
      }

      const data = await response.json();
      
      // Extract partition data from response
      if (data.results && data.results[0] && data.results[0].tables && data.results[0].tables[0]) {
        return data.results[0].tables[0].rows || [];
      }
      
      return [];
    } catch (error) {
      console.warn(`Failed to get table storage modes for dataset ${datasetId}:`, error);
      // Return empty array so we fall back to heuristic approach
      return [];
    }
  }

  // Get intelligent context-aware refresh duration estimate
  async getRefreshEstimate(
    accessToken: string,
    workspaceId: string,
    datasetId: string
  ): Promise<RefreshEstimate> {
    try {
      // Get dataset information for context
      const dataset = await this.getDataset(accessToken, workspaceId, datasetId);
      
      // Get refresh history (extended to get more historical context)
      const rawHistory = await this.getDatasetRefreshHistory(accessToken, workspaceId, datasetId);
      
      // Advanced filtering and classification
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      // Process and classify refresh entries
      const processedHistory: (RefreshHistoryEntry & {
        ageDays: number;
        classifiedType: 'Manual' | 'Scheduled' | 'Unknown';
        weight: number;
      })[] = rawHistory
        .filter(entry => 
          entry.status === 'Completed' && 
          entry.startTime && 
          entry.endTime &&
          new Date(entry.startTime) >= sixtyDaysAgo // Only last 60 days
        )
        .map(entry => {
          const startTime = new Date(entry.startTime);
          const endTime = new Date(entry.endTime);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationSeconds = Math.max(1, Math.floor(durationMs / 1000));
          
          // Calculate age in days
          const ageDays = (now.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000);
          
          // Classify refresh type using sophisticated heuristics
          const classifiedType = this.classifyRefreshType(entry, startTime);
          
          // Calculate recency weight with exponential decay (τ=7 days)
          const recencyWeight = Math.exp(-ageDays / 7);
          
          // Storage mode matching weight
          const storageMatchWeight = 1.0; // All from same dataset, so always matches
          
          // Type matching weight (will be applied later when filtering)
          const baseWeight = recencyWeight * storageMatchWeight;
          
          return {
            refreshType: entry.refreshType || 'Full',
            startTime: entry.startTime,
            endTime: entry.endTime,
            status: 'Completed' as const,
            refreshDurationSeconds: durationSeconds,
            ageDays,
            classifiedType,
            weight: baseWeight
          };
        })
        .slice(0, 50); // Cap at 50 entries for performance
      
      if (processedHistory.length === 0) {
        return this.getFallbackEstimate(dataset.storageMode);
      }
      
      // Determine the refresh context for current request (assume Manual for user-triggered)
      const currentRefreshType: 'Manual' | 'Scheduled' = 'Manual'; // Most refresh requests are manual
      
      // Smart filtering: prefer matching refresh types, but fall back if insufficient data
      let relevantHistory = processedHistory.filter(entry => entry.classifiedType === currentRefreshType);
      
      // Apply type matching weight and ensure minimum sample size
      if (relevantHistory.length < 3) {
        // Not enough matching data, use all data but with type weighting
        relevantHistory = processedHistory.map(entry => ({
          ...entry,
          weight: entry.weight * (entry.classifiedType === currentRefreshType ? 1.0 : 0.6)
        }));
      }
      
      // Extract durations and weights for robust statistics
      const durationsWithWeights = relevantHistory.map(entry => ({
        duration: entry.refreshDurationSeconds,
        weight: entry.weight
      }));
      
      // Remove outliers using Median Absolute Deviation (MAD)
      const filteredData = this.removeOutliersUsingMAD(durationsWithWeights);
      
      if (filteredData.length === 0) {
        return this.getFallbackEstimate(dataset.storageMode);
      }
      
      // Calculate robust statistics using weighted percentiles
      const stats = this.calculateWeightedPercentiles(filteredData);
      const p50 = stats.p50; // Median
      const p80 = stats.p80; // 80th percentile
      const weightedMean = stats.weightedMean;
      
      // Calculate confidence based on effective sample size and coefficient of variation
      const effectiveN = this.calculateEffectiveSampleSize(filteredData);
      const coefficientOfVariation = stats.standardDeviation / weightedMean;
      
      let confidenceLevel: "low" | "medium" | "high" = "low";
      if (effectiveN >= 5 && coefficientOfVariation < 0.3) {
        confidenceLevel = "high";
      } else if (effectiveN >= 3 && coefficientOfVariation < 0.5) {
        confidenceLevel = "medium";
      }
      
      // Enhanced contextual factors
      const currentHour = new Date().getHours();
      const isPeakHour = currentHour >= 9 && currentHour <= 17;
      
      // Recent failures check (last 5 attempts)
      const recentAttempts = rawHistory.slice(0, 5);
      const recentFailures = recentAttempts.some(entry => 
        entry.status === 'Failed' || entry.status === 'Cancelled'
      );
      
      // Dataset size heuristics - use P80 for more conservative estimate
      const isLargeDataset = p80 > 300; // Over 5 minutes at P80
      
      // Generate contextual message with refresh type awareness
      const message = this.generateContextualMessage(
        p50,
        p80,
        confidenceLevel,
        dataset.storageMode,
        currentRefreshType,
        isLargeDataset,
        effectiveN
      );
      
      // Calculate estimate range based on P50 and P80
      let estimatedMin = Math.floor(p50 * 0.7);
      let estimatedMax = Math.floor(p80 * (isPeakHour ? 1.2 : 1.1));
      
      // Ensure reasonable bounds
      estimatedMin = Math.max(1, estimatedMin);
      estimatedMax = Math.max(estimatedMin + 1, estimatedMax);
      
      return {
        estimateRangeSeconds: {
          min: estimatedMin,
          max: estimatedMax,
          median: Math.floor(p50)
        },
        confidenceLevel,
        historicalDataPoints: filteredData.length,
        averageDurationSeconds: Math.floor(weightedMean),
        contextualFactors: {
          storageMode: dataset.storageMode,
          isLargeDataset,
          isPeakHour,
          recentFailures
        },
        message
      };
      
    } catch (error) {
      console.warn(`Failed to generate refresh estimate for dataset ${datasetId}:`, error);
      return this.getFallbackEstimate("Unknown");
    }
  }
  
  // Generate fallback estimates when no historical data is available
  private getFallbackEstimate(storageMode: string): RefreshEstimate {
    let baseEstimateSeconds = 120; // Default 2 minutes
    let message = "Estimated duration based on dataset type";
    
    // Storage mode-based estimates
    switch (storageMode) {
      case "Import":
        baseEstimateSeconds = 180; // 3 minutes
        message = "Import datasets typically refresh in 1-5 minutes";
        break;
      case "Direct Query":
        baseEstimateSeconds = 30; // 30 seconds
        message = "Direct Query datasets refresh quickly (usually under 1 minute)";
        break;
      case "LiveConnection":
        baseEstimateSeconds = 15; // 15 seconds
        message = "Live connections refresh very quickly";
        break;
      case "Composite":
        baseEstimateSeconds = 300; // 5 minutes
        message = "Mixed datasets may take longer to refresh";
        break;
      default:
        message = "First refresh - time estimate will improve with history";
    }
    
    return {
      estimateRangeSeconds: {
        min: Math.floor(baseEstimateSeconds * 0.5),
        max: Math.floor(baseEstimateSeconds * 2),
        median: baseEstimateSeconds
      },
      confidenceLevel: "low",
      historicalDataPoints: 0,
      averageDurationSeconds: baseEstimateSeconds,
      contextualFactors: {
        storageMode,
        isLargeDataset: false,
        isPeakHour: false,
        recentFailures: false
      },
      message
    };
  }
  
  // Classify refresh type using sophisticated heuristics
  private classifyRefreshType(entry: any, startTime: Date): 'Manual' | 'Scheduled' | 'Unknown' {
    // Check explicit refresh type first
    if (entry.refreshType) {
      const type = entry.refreshType.toLowerCase();
      if (type.includes('schedule') || type.includes('automatic')) {
        return 'Scheduled';
      }
      if (type.includes('manual') || type.includes('demand') || type.includes('user')) {
        return 'Manual';
      }
    }
    
    // Use timing patterns to infer refresh type
    const hour = startTime.getHours();
    const minute = startTime.getMinutes();
    const dayOfWeek = startTime.getDay(); // 0=Sunday, 6=Saturday
    
    // Scheduled refreshes typically happen:
    // - At exact hour boundaries (0, 15, 30, 45 minutes)
    // - During business hours or off-peak times
    // - On weekdays more than weekends
    const isExactTiming = (minute === 0 || minute === 15 || minute === 30 || minute === 45);
    const isOffPeak = (hour < 6 || hour > 22); // Very early or very late
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // Scoring system for classification
    let scheduledScore = 0;
    
    if (isExactTiming) scheduledScore += 3;
    if (isOffPeak) scheduledScore += 2;
    if (!isWeekend) scheduledScore += 1;
    if (hour >= 2 && hour <= 5) scheduledScore += 2; // Common scheduled time
    
    // Manual refreshes are more likely during business hours, random minutes
    if (scheduledScore >= 4) {
      return 'Scheduled';
    } else if (scheduledScore <= 1 && hour >= 8 && hour <= 18 && !isExactTiming) {
      return 'Manual';
    }
    
    return 'Unknown';
  }
  
  // Remove outliers using Median Absolute Deviation (MAD)
  private removeOutliersUsingMAD(data: { duration: number; weight: number }[]): { duration: number; weight: number }[] {
    if (data.length < 3) return data;
    
    const durations = data.map(d => d.duration).sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)];
    
    // Calculate MAD (Median Absolute Deviation)
    const deviations = durations.map(d => Math.abs(d - median)).sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)];
    
    // Use modified Z-score with MAD (threshold of 3.5 is commonly used)
    const threshold = 3.5;
    const madConstant = 1.4826; // For normal distribution consistency
    
    return data.filter(item => {
      const modifiedZScore = Math.abs(0.6745 * (item.duration - median)) / (mad * madConstant);
      return modifiedZScore < threshold;
    });
  }
  
  // Calculate weighted percentiles and statistics
  private calculateWeightedPercentiles(data: { duration: number; weight: number }[]): {
    p50: number;
    p80: number;
    weightedMean: number;
    standardDeviation: number;
  } {
    if (data.length === 0) {
      return { p50: 0, p80: 0, weightedMean: 0, standardDeviation: 0 };
    }
    
    // Sort by duration for percentile calculation
    const sortedData = [...data].sort((a, b) => a.duration - b.duration);
    
    // Calculate total weight
    const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
    
    // Calculate weighted mean
    const weightedSum = data.reduce((sum, item) => sum + item.duration * item.weight, 0);
    const weightedMean = weightedSum / totalWeight;
    
    // Calculate weighted percentiles
    let cumulativeWeight = 0;
    let p50 = sortedData[0].duration;
    let p80 = sortedData[0].duration;
    
    const target50 = totalWeight * 0.5;
    const target80 = totalWeight * 0.8;
    
    for (const item of sortedData) {
      cumulativeWeight += item.weight;
      
      if (cumulativeWeight >= target50 && p50 === sortedData[0].duration) {
        p50 = item.duration;
      }
      if (cumulativeWeight >= target80 && p80 === sortedData[0].duration) {
        p80 = item.duration;
        break;
      }
    }
    
    // Calculate weighted standard deviation
    const weightedVariance = data.reduce((sum, item) => 
      sum + item.weight * Math.pow(item.duration - weightedMean, 2), 0
    ) / totalWeight;
    const standardDeviation = Math.sqrt(weightedVariance);
    
    return { p50, p80, weightedMean, standardDeviation };
  }
  
  // Calculate effective sample size accounting for weights
  private calculateEffectiveSampleSize(data: { duration: number; weight: number }[]): number {
    if (data.length === 0) return 0;
    
    const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
    const sumOfSquaredWeights = data.reduce((sum, item) => sum + item.weight * item.weight, 0);
    
    // Effective sample size formula: (sum of weights)^2 / (sum of squared weights)
    const effectiveN = Math.min(data.length, (totalWeight * totalWeight) / sumOfSquaredWeights);
    
    return Math.floor(effectiveN);
  }
  
  // Generate contextual message with enhanced context awareness
  private generateContextualMessage(
    p50: number,
    p80: number,
    confidence: "low" | "medium" | "high",
    storageMode: string,
    refreshType: 'Manual' | 'Scheduled',
    isLarge: boolean,
    effectiveN: number
  ): string {
    const medianMinutes = Math.ceil(p50 / 60);
    const maxMinutes = Math.ceil(p80 / 60);
    
    // Confidence qualifiers
    const confidenceText = {
      "high": "typically",
      "medium": "usually", 
      "low": "estimated"
    }[confidence];
    
    const refreshTypeText = refreshType === 'Manual' ? 'Manual refresh' : 'Scheduled refresh';
    
    // Build contextual message based on duration and context
    if (p50 < 60) {
      return ``;
    } else if (p50 < 300) {
      const rangeText = p80 > p50 * 1.5 ? ` (up to ${maxMinutes} min)` : '';
      return `${refreshTypeText} - ${confidenceText} takes ${medianMinutes} minute${medianMinutes > 1 ? 's' : ''}${rangeText} (${confidence} confidence)`;
    } else if (p50 < 1800) {
      const contextText = isLarge ? 'Large dataset' : storageMode === 'Import' ? 'Import mode' : 'Standard refresh';
      return `${contextText} - ${confidenceText} takes ${medianMinutes} minutes (${confidence} confidence)`;
    } else {
      return `Extended refresh - ${confidenceText} takes ${Math.floor(medianMinutes)} minutes (large ${storageMode} dataset)`;
    }
  }
  
  // Legacy generate estimate message (kept for backward compatibility)
  private generateEstimateMessage(
    averageSeconds: number,
    confidence: "low" | "medium" | "high",
    storageMode: string,
    isLarge: boolean
  ): string {
    const minutes = Math.ceil(averageSeconds / 60);
    const confidenceText = confidence === "high" ? "typically" : confidence === "medium" ? "usually" : "estimated";
    
    if (averageSeconds < 60) {
      return `Quick refresh - ${confidenceText} completes in under 1 minute`;
    } else if (averageSeconds < 300) {
      return `${confidenceText} takes ${minutes} minute${minutes > 1 ? 's' : ''} to complete`;
    } else if (averageSeconds < 1800) {
      return `${isLarge ? 'Large dataset' : 'Standard refresh'} - ${confidenceText} takes ${minutes} minutes`;
    } else {
      return `Long refresh - ${confidenceText} takes ${Math.floor(minutes / 60)}+ hours (consider optimizing)`;
    }
  }

  // Determine storage mode using hardcoded mappings first, then simple fallback logic  
  private async determineStorageMode(
    accessToken: string, 
    workspaceId: string, 
    datasetId: string, 
    dataset: any
  ): Promise<"Import" | "Direct Query" | "LiveConnection" | "Composite" | "Unknown"> {
    try {
      // 1. Check hardcoded mapping by dataset name first
      if (dataset.name && this.HARDCODED_STORAGE_MODES[dataset.name]) {
        const mode = this.HARDCODED_STORAGE_MODES[dataset.name];
        console.log(`Hardcoded mapping: Dataset "${dataset.name}" → ${mode}`);
        return mode;
      }

      // 2. Simple automatic detection for clear cases only
      const dataSources = await this.getDatasetDataSources(accessToken, workspaceId, datasetId);
      const analysisServicesCount = dataSources.filter(ds => ds.datasourceType === 'AnalysisServices').length;
      
      // LiveConnection: Analysis Services + not refreshable (clear automatic case)
      if (analysisServicesCount > 0 && !dataset.isRefreshable) {
        console.log(`LiveConnection detected for dataset ${datasetId}: Analysis Services connection, not refreshable`);
        return 'LiveConnection';
      }
      
      // 3. Default to Import for all other cases
      // This avoids the false positive "Composite" classifications
      console.log(`Import assumed for dataset "${dataset.name}" (${datasetId}): No hardcoded mapping, defaulting to Import`);
      return 'Import';
      
    } catch (error) {
      console.warn("Could not determine storage mode:", error);
      return 'Unknown';
    }
  }


  // Create embed configuration (supports both regular and paginated reports)
  async createEmbedConfig(
    accessToken: string,
    workspaceId: string,
    reportId: string,
    accessLevel: string = "View",
    allowSaveAs?: boolean
  ): Promise<ReportEmbedConfig> {
    const report = await this.getReport(accessToken, workspaceId, reportId);
    
    // Detect report type - Power BI API returns it as "type" not "reportType"
    // Can be "Report" (PBIX) or "PaginatedReport" (.rdl)
    const reportType = report.type || report.reportType || 'Report';
    console.log(`📊 Report type detected: ${reportType} for report ${report.name} (from API field: ${report.type ? 'type' : 'reportType'})`);
    
    // For paginated reports, try to resolve datasetId
    let datasetId = report.datasetId;
    if (reportType === 'PaginatedReport' && !datasetId) {
      console.log(`📊 Paginated report "${report.name}" has no datasetId - checking datasources...`);
      // Try to fetch the dataset ID from the report's datasources
      const fetchedDatasetId = await this.getReportDataSources(accessToken, workspaceId, reportId);
      if (fetchedDatasetId) {
        datasetId = fetchedDatasetId;
        console.log(`✅ Resolved dataset ID for paginated report: ${datasetId}`);
      } else {
        console.log(`ℹ️ Paginated report "${report.name}" uses external data sources (no Power BI dataset found)`);
      }
    }
    
    const embedToken = await this.getEmbedToken(
      accessToken, 
      workspaceId, 
      reportId, 
      datasetId, 
      accessLevel, 
      allowSaveAs,
      reportType
    );

    return {
      reportId,
      embedUrl: report.embedUrl,
      accessToken: embedToken.accessToken,
      reportType, // Include report type for client-side embedding
      workspaceId, // Include workspaceId for token refresh
      datasetId: report.datasetId, // Include datasetId for dataset refresh
      expiration: embedToken.expiration,
      tokenId: embedToken.tokenId,
      settings: {
        filterPaneEnabled: true,
        navContentPaneEnabled: false, // Disable legacy left nav to allow bottom page tabs
        background: 0, // 0 = Default background (consistent with client-side)
        zoomLevel: 1, // Default zoom level (1 = 100%, valid range is 0.1-4)
        bars: {
          statusBar: {
            visible: true,
          },
          actionBar: {
            visible: true, // Always show action bar (will only appear in edit mode anyway)
          },
        },
        panes: {
          pageNavigation: {
            visible: true, // Show page navigation
            position: 1, // 1 = Bottom (horizontal tabs), 0 = Left (vertical)
          },
          filters: {
            visible: true,
          },
        },
      },
    };
  }

  // Export report to file - creates export job
  async createExportJob(
    accessToken: string,
    workspaceId: string,
    reportId: string,
    format: string,
    config?: any
  ): Promise<{ id: string }> {
    const exportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/ExportTo`;
    
    const requestBody = {
      format: format.toUpperCase(),
      ...config
    };

    try {
      const response = await fetch(exportUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export job creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return { id: result.id };
    } catch (error) {
      throw new Error(`Failed to create export job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get export job status
  async getExportStatus(
    accessToken: string,
    workspaceId: string,
    reportId: string,
    exportId: string
  ): Promise<{ id: string; status: string; percentComplete?: number; error?: string }> {
    const statusUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/exports/${exportId}`;

    try {
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export status check failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return {
        id: result.id,
        status: result.status,
        percentComplete: result.percentComplete,
        error: result.error
      };
    } catch (error) {
      throw new Error(`Failed to get export status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Download exported file
  async downloadExportFile(
    accessToken: string,
    workspaceId: string,
    reportId: string,
    exportId: string
  ): Promise<Buffer> {
    const downloadUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/exports/${exportId}/file`;

    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File download failed: ${response.status} - ${errorText}`);
      }

      // Return as buffer for file download
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      throw new Error(`Failed to download export file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const powerBIService = new PowerBIService();
