import { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, FileText, FilePlus, Loader2, FileIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders: boolean;
  includeFooters: boolean;
  includeTimestamp: boolean;
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter' | 'legal';
  fontSize: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  customHeader: string;
  customFooter: string;
  fileName: string;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf', exportAllData: boolean) => Promise<void>;
  tableName?: string;
  selectedColumns?: string[];
  isExporting?: boolean;
  exportProgress?: number;
  exportMessage?: string;
}

export const ExportDialog = memo(({
  isOpen,
  onClose,
  onExport,
  tableName = 'report',
  selectedColumns = [],
  isExporting = false,
  exportProgress = 0,
  exportMessage = ''
}: ExportDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [exportAllData, setExportAllData] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [customHeader, setCustomHeader] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  const handleExport = useCallback(() => {
    onExport(selectedFormat, exportAllData);
  }, [selectedFormat, exportAllData, onExport]);

  const getFormatIcon = (format: 'csv' | 'excel' | 'pdf') => {
    switch (format) {
      case 'csv':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'pdf':
        return <FileIcon className="h-8 w-8 text-red-500" />;
    }
  };

  const getFormatDescription = (format: 'csv' | 'excel' | 'pdf') => {
    switch (format) {
      case 'csv':
        return 'Comma-separated values file, compatible with all spreadsheet programs';
      case 'excel':
        return 'Microsoft Excel workbook with formatted columns and auto-sizing';
      case 'pdf':
        return 'PDF document with professional formatting and print-ready layout';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Report Data</DialogTitle>
          <DialogDescription>
            Export your {tableName} data with {selectedColumns.length} selected columns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {exportMessage || 'Preparing export...'}
                </span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Format selection */}
          {!isExporting && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {(['csv', 'excel', 'pdf'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${selectedFormat === format
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20'
                      }
                    `}
                    data-testid={`button-format-${format}`}
                  >
                    {getFormatIcon(format)}
                    <div className="text-center">
                      <div className="font-medium text-sm uppercase">{format}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getFormatDescription(format)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Data scope selection */}
              <div className="space-y-3">
                <Label>Data Scope</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-all"
                    checked={exportAllData}
                    onCheckedChange={(checked) => setExportAllData(checked as boolean)}
                    data-testid="checkbox-export-all"
                  />
                  <label
                    htmlFor="export-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Export all data (not just current page)
                  </label>
                </div>
                {exportAllData && (
                  <p className="text-xs text-muted-foreground">
                    All data will be fetched in chunks of 100 rows. Large datasets may take longer to export.
                  </p>
                )}
              </div>

              {/* Optional headers/footers */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-header"
                    checked={includeHeader}
                    onCheckedChange={(checked) => setIncludeHeader(checked as boolean)}
                    data-testid="checkbox-include-header"
                  />
                  <label htmlFor="include-header" className="text-sm font-medium">
                    Include header
                  </label>
                </div>
                {includeHeader && (
                  <Textarea
                    value={customHeader}
                    onChange={(e) => setCustomHeader(e.target.value)}
                    placeholder="Optional custom header text..."
                    rows={2}
                    className="text-sm"
                    data-testid="textarea-header"
                  />
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-footer"
                    checked={includeFooter}
                    onCheckedChange={(checked) => setIncludeFooter(checked as boolean)}
                    data-testid="checkbox-include-footer"
                  />
                  <label htmlFor="include-footer" className="text-sm font-medium">
                    Include footer
                  </label>
                </div>
                {includeFooter && (
                  <Textarea
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    placeholder="Optional custom footer text..."
                    rows={2}
                    className="text-sm"
                    data-testid="textarea-footer"
                  />
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-timestamp"
                    checked={includeTimestamp}
                    onCheckedChange={(checked) => setIncludeTimestamp(checked as boolean)}
                    data-testid="checkbox-include-timestamp"
                  />
                  <label htmlFor="include-timestamp" className="text-sm font-medium">
                    Include timestamp
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            data-testid="button-export-confirm"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ExportDialog.displayName = 'ExportDialog';

interface ExportSettingsProps {
  exportConfig: ExportConfig;
  onUpdateConfig: (updates: Partial<ExportConfig>) => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  isExporting?: boolean;
}

export const ExportSettings = memo(({
  exportConfig,
  onUpdateConfig,
  onExport,
  isExporting = false
}: ExportSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Settings
        </CardTitle>
        <CardDescription>
          Configure export options for your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick export buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onExport('csv')}
            disabled={isExporting}
            variant="outline"
            className="flex-1"
            data-testid="button-export-csv"
          >
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            onClick={() => onExport('excel')}
            disabled={isExporting}
            variant="outline"
            className="flex-1"
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={() => onExport('pdf')}
            disabled={isExporting}
            variant="outline"
            className="flex-1"
            data-testid="button-export-pdf"
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>

        {/* File name */}
        <div className="space-y-2">
          <Label>File Name</Label>
          <Input
            value={exportConfig.fileName}
            onChange={(e) => onUpdateConfig({ fileName: e.target.value })}
            placeholder="report"
            data-testid="input-filename"
          />
        </div>

        {/* Format-specific settings */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select
            value={exportConfig.format}
            onValueChange={(value) => 
              onUpdateConfig({ format: value as ExportConfig['format'] })
            }
            data-testid="select-export-format"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PDF-specific settings */}
        {exportConfig.format === 'pdf' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orientation</Label>
                <Select
                  value={exportConfig.orientation}
                  onValueChange={(value) => 
                    onUpdateConfig({ orientation: value as 'portrait' | 'landscape' })
                  }
                  data-testid="select-orientation"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select
                  value={exportConfig.paperSize}
                  onValueChange={(value) => 
                    onUpdateConfig({ paperSize: value as 'a4' | 'letter' | 'legal' })
                  }
                  data-testid="select-paper-size"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                value={exportConfig.fontSize}
                onChange={(e) => onUpdateConfig({ fontSize: Number(e.target.value) })}
                min="8"
                max="20"
                data-testid="input-font-size"
              />
            </div>

            {/* Margins */}
            <div className="space-y-2">
              <Label>Margins (mm)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={exportConfig.marginTop}
                  onChange={(e) => onUpdateConfig({ marginTop: Number(e.target.value) })}
                  placeholder="Top"
                  data-testid="input-margin-top"
                />
                <Input
                  type="number"
                  value={exportConfig.marginBottom}
                  onChange={(e) => onUpdateConfig({ marginBottom: Number(e.target.value) })}
                  placeholder="Bottom"
                  data-testid="input-margin-bottom"
                />
                <Input
                  type="number"
                  value={exportConfig.marginLeft}
                  onChange={(e) => onUpdateConfig({ marginLeft: Number(e.target.value) })}
                  placeholder="Left"
                  data-testid="input-margin-left"
                />
                <Input
                  type="number"
                  value={exportConfig.marginRight}
                  onChange={(e) => onUpdateConfig({ marginRight: Number(e.target.value) })}
                  placeholder="Right"
                  data-testid="input-margin-right"
                />
              </div>
            </div>
          </>
        )}

        {/* Headers and footers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="include-headers">Include Headers</Label>
            <Switch
              id="include-headers"
              checked={exportConfig.includeHeaders}
              onCheckedChange={(checked) => onUpdateConfig({ includeHeaders: checked })}
              data-testid="switch-include-headers"
            />
          </div>
          
          {exportConfig.includeHeaders && (
            <Textarea
              value={exportConfig.customHeader}
              onChange={(e) => onUpdateConfig({ customHeader: e.target.value })}
              placeholder="Custom header text..."
              rows={2}
              data-testid="textarea-custom-header"
            />
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-footers">Include Footers</Label>
            <Switch
              id="include-footers"
              checked={exportConfig.includeFooters}
              onCheckedChange={(checked) => onUpdateConfig({ includeFooters: checked })}
              data-testid="switch-include-footers"
            />
          </div>
          
          {exportConfig.includeFooters && (
            <Textarea
              value={exportConfig.customFooter}
              onChange={(e) => onUpdateConfig({ customFooter: e.target.value })}
              placeholder="Custom footer text..."
              rows={2}
              data-testid="textarea-custom-footer"
            />
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-timestamp">Include Timestamp</Label>
            <Switch
              id="include-timestamp"
              checked={exportConfig.includeTimestamp}
              onCheckedChange={(checked) => onUpdateConfig({ includeTimestamp: checked })}
              data-testid="switch-include-timestamp"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ExportSettings.displayName = 'ExportSettings';