import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ServicePrincipalAuth {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

interface PowerBIWorkspace {
  id: string;
  name: string;
  isReadOnly: boolean;
  isOnDedicatedCapacity: boolean;
}

interface PowerBIReportSummary {
  id: string;
  name: string;
  embedUrl: string;
  workspaceId: string;
  datasetId: string;
  datasetName: string;
  reportType?: string; // "Report" for standard PBIX, "PaginatedReport" for RDL
}

export interface PowerBIDataset {
  id: string;
  name: string;
  isRefreshable: boolean;
  isEffectiveIdentityRequired: boolean;
  isOnPremGatewayRequired: boolean;
  storageMode: "Import" | "Direct Query" | "LiveConnection" | "Composite" | "Unknown";
}

export function usePowerBIAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");

  // Secure authentication - no AAD token exposed to client
  const authenticateAuto = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const response = await fetch("/api/auth/auto");
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.connected);
        setConnectionStatus(data.message || "Connected to Power BI");
        return data.connected;
      } else {
        const errorData = await response.json();
        setIsAuthenticated(false);
        setConnectionStatus(errorData.message || "Connection failed");
        throw new Error(errorData.message || "Automatic authentication failed");
      }
    } catch (error) {
      setIsAuthenticated(false);
      const errorMessage = error instanceof Error ? error.message : "Connection failed";
      setConnectionStatus(errorMessage);
      console.error("Auto-authentication failed:", errorMessage);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const clearAuth = useCallback(() => {
    setIsAuthenticated(false);
    setConnectionStatus("");
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    connectionStatus,
    authenticateAuto,
    clearAuth,
  };
}

export function usePowerBIWorkspaces(isAuthenticated: boolean) {
  return useQuery<PowerBIWorkspace[]>({
    queryKey: ["/api/powerbi/workspaces"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      const response = await fetch("/api/powerbi/workspaces");
      
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      
      return response.json();
    },
    enabled: isAuthenticated,
  });
}

export function usePowerBIReports(isAuthenticated: boolean, workspaceId: string) {
  return useQuery<PowerBIReportSummary[]>({
    queryKey: ["/api/powerbi/workspaces", workspaceId, "reports"],
    queryFn: async () => {
      if (!isAuthenticated || !workspaceId) return [];
      
      const response = await fetch(`/api/powerbi/workspaces/${workspaceId}/reports`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!workspaceId,
  });
}

export function usePowerBIDatasets(isAuthenticated: boolean, workspaceId: string) {
  return useQuery<PowerBIDataset[]>({
    queryKey: ["/api/powerbi/workspaces", workspaceId, "datasets"],
    queryFn: async () => {
      if (!isAuthenticated || !workspaceId) return [];
      
      const response = await fetch(`/api/powerbi/workspaces/${workspaceId}/datasets`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch datasets");
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!workspaceId,
  });
}

export function usePowerBIDataset(isAuthenticated: boolean, workspaceId: string, datasetId: string) {
  return useQuery<PowerBIDataset>({
    queryKey: ["/api/powerbi/workspaces", workspaceId, "datasets", datasetId],
    queryFn: async () => {
      if (!isAuthenticated || !workspaceId || !datasetId) {
        throw new Error("Authentication, workspace ID, and dataset ID are required");
      }
      
      const response = await fetch(`/api/powerbi/workspaces/${workspaceId}/datasets/${datasetId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch dataset information");
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!workspaceId && !!datasetId,
  });
}

export function usePowerBIDatasetTables(isAuthenticated: boolean, workspaceId: string, datasetId: string) {
  return useQuery<any[]>({
    queryKey: ["/api/powerbi/workspaces", workspaceId, "datasets", datasetId, "tables"],
    queryFn: async () => {
      if (!isAuthenticated || !workspaceId || !datasetId) {
        return [];
      }
      
      const response = await fetch(`/api/powerbi/workspaces/${workspaceId}/datasets/${datasetId}/tables`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch dataset tables");
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!workspaceId && !!datasetId,
  });
}