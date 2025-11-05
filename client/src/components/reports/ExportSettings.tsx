import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";

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
            <File className="mr-2 h-4 w-4" />
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