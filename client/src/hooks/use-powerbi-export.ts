import { useState, useCallback } from 'react';

export type ExportFormat = 'PDF' | 'PPTX' | 'PNG' | 'XLSX';

interface ExportConfig {
  format: ExportFormat;
  powerBIReportConfiguration?: {
    pages?: Array<{ pageName: string }>;
    defaultBookmark?: { name: string };
    reportLevelFilters?: Array<any>;
    identities?: Array<{
      username: string;
      roles: string[];
      datasets: string[];
    }>;
  };
}

interface ExportStatus {
  id: string;
  status: 'Running' | 'Succeeded' | 'Failed';
  error?: string;
  percentComplete?: number;
  resourceLocation?: string;
}

export const usePowerBIExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');

  const exportReport = useCallback(async (
    workspaceId: string,
    reportId: string,
    config: ExportConfig
  ): Promise<Blob> => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initiating export...');

    try {
      // Step 1: Create export job
      setExportStatus('Creating export job...');
      const exportId = await createExportJob(workspaceId, reportId, config);
      
      // Step 2: Poll for completion
      setExportStatus('Processing export...');
      await pollExportStatus(workspaceId, reportId, exportId);
      
      // Step 3: Download file
      setExportStatus('Downloading file...');
      const fileBlob = await downloadFile(workspaceId, reportId, exportId);
      
      setExportStatus('Export completed successfully!');
      setExportProgress(100);
      
      return fileBlob;

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed');
      throw error;
    } finally {
      setIsExporting(false);
      // Reset progress after a delay
      setTimeout(() => {
        setExportProgress(0);
        setExportStatus('');
      }, 3000);
    }
  }, []);

  const createExportJob = async (
    workspaceId: string,
    reportId: string,
    config: ExportConfig
  ): Promise<string> => {
    const url = `/api/powerbi/export/${workspaceId}/${reportId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  };

  const pollExportStatus = async (
    workspaceId: string,
    reportId: string,
    exportId: string,
    maxAttempts: number = 60
  ): Promise<void> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const url = `/api/powerbi/export/${workspaceId}/${reportId}/${exportId}/status`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const status: ExportStatus = await response.json();
      
      // Update progress
      const progress = Math.round((attempt / maxAttempts) * 90); // Reserve 10% for download
      setExportProgress(progress);
      
      if (status.status === 'Succeeded') {
        setExportProgress(90);
        return;
      } else if (status.status === 'Failed') {
        throw new Error(`Export failed: ${status.error || 'Unknown error'}`);
      }
      
      // Update status message
      if (status.percentComplete !== undefined) {
        setExportStatus(`Processing export...`);
        setExportProgress(Math.round(status.percentComplete * 0.9)); // Scale to 90%
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Export timeout - job did not complete within expected time');
  };

  const downloadFile = async (
    workspaceId: string,
    reportId: string,
    exportId: string
  ): Promise<Blob> => {
    const url = `/api/powerbi/export/${workspaceId}/${reportId}/${exportId}/file`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`File download failed: ${response.status}`);
    }

    return response.blob();
  };

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportToPDF = useCallback(async (
    workspaceId: string,
    reportId: string,
    reportName: string = 'report',
    pages?: string[]
  ) => {
    const config: ExportConfig = {
      format: 'PDF',
      powerBIReportConfiguration: pages ? {
        pages: pages.map(pageName => ({ pageName }))
      } : undefined
    };

    const blob = await exportReport(workspaceId, reportId, config);
    downloadBlob(blob, `${reportName}.pdf`);
  }, [exportReport, downloadBlob]);

  const exportToPowerPoint = useCallback(async (
    workspaceId: string,
    reportId: string,
    reportName: string = 'report',
    pages?: string[]
  ) => {
    const config: ExportConfig = {
      format: 'PPTX',
      powerBIReportConfiguration: pages ? {
        pages: pages.map(pageName => ({ pageName }))
      } : undefined
    };

    const blob = await exportReport(workspaceId, reportId, config);
    downloadBlob(blob, `${reportName}.pptx`);
  }, [exportReport, downloadBlob]);

  const exportToPNG = useCallback(async (
    workspaceId: string,
    reportId: string,
    reportName: string = 'report',
    pageName?: string
  ) => {
    const config: ExportConfig = {
      format: 'PNG',
      powerBIReportConfiguration: {
        pages: pageName ? [{ pageName }] : undefined
      }
    };

    const blob = await exportReport(workspaceId, reportId, config);
    downloadBlob(blob, `${reportName}.png`);
  }, [exportReport, downloadBlob]);

  return {
    exportReport,
    exportToPDF,
    exportToPowerPoint,
    exportToPNG,
    isExporting,
    exportProgress,
    exportStatus,
    downloadBlob
  };
};