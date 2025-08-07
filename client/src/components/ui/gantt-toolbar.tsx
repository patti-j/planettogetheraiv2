import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Calendar,
  Search,
  Printer,
  Eye,
  EyeOff,
  Settings,
  Info,
  Link,
  Layers,
  Clock,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export type ZoomLevel = 'hour' | 'shift' | 'day' | 'week' | 'twoWeeks' | 'month' | 'quarter' | 'year';
export type FadeMode = 'none' | 'job' | 'operation' | 'activity' | 'inventory' | 'all-relations';

interface GanttToolbarProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  onJobSearch: (query: string) => void;
  onResourceSearch: (query: string) => void;
  onPrint: () => void;
  onExport: () => void;
  fadeMode: FadeMode;
  onFadeModeChange: (mode: FadeMode) => void;
  showTooltips: boolean;
  onTooltipsToggle: (show: boolean) => void;
  showActivityLinks: boolean;
  onActivityLinksToggle: (show: boolean) => void;
  showSchedulingHints: boolean;
  onSchedulingHintsToggle: (show: boolean) => void;
  dailyView: boolean;
  onDailyViewToggle: (view: boolean) => void;
  variableZoom: boolean;
  onVariableZoomToggle: (enabled: boolean) => void;
  variableZoomFactor: number;
  onVariableZoomFactorChange: (factor: number) => void;
  onResizeToFit: () => void;
  onDisplaySettings: () => void;
  anchorOnDrop: boolean;
  onAnchorOnDropToggle: (enabled: boolean) => void;
  lockOnDrop: boolean;
  onLockOnDropToggle: (enabled: boolean) => void;
  expediteSuccessors: boolean;
  onExpediteSuccessorsToggle: (enabled: boolean) => void;
}

export default function GanttToolbar({
  zoomLevel,
  onZoomChange,
  onJobSearch,
  onResourceSearch,
  onPrint,
  onExport,
  fadeMode,
  onFadeModeChange,
  showTooltips,
  onTooltipsToggle,
  showActivityLinks,
  onActivityLinksToggle,
  showSchedulingHints,
  onSchedulingHintsToggle,
  dailyView,
  onDailyViewToggle,
  variableZoom,
  onVariableZoomToggle,
  variableZoomFactor,
  onVariableZoomFactorChange,
  onResizeToFit,
  onDisplaySettings,
  anchorOnDrop,
  onAnchorOnDropToggle,
  lockOnDrop,
  onLockOnDropToggle,
  expediteSuccessors,
  onExpediteSuccessorsToggle,
}: GanttToolbarProps) {
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [showResourceSearch, setShowResourceSearch] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            // Zoom to now - would need current time implementation
            break;
          case 't':
            e.preventDefault();
            if (e.shiftKey) {
              onZoomChange('twoWeeks');
            } else {
              onZoomChange('day');
            }
            break;
          case 'w':
            e.preventDefault();
            onZoomChange('week');
            break;
          case 'm':
            e.preventDefault();
            onZoomChange('month');
            break;
          case 'y':
            e.preventDefault();
            onZoomChange('year');
            break;
          case 'f':
            e.preventDefault();
            // Frozen span - would need implementation
            break;
          case 's':
            e.preventDefault();
            // Stable span - would need implementation
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onZoomChange]);

  const zoomLevels: { value: ZoomLevel; label: string; shortcut?: string }[] = [
    { value: 'hour', label: 'Hour' },
    { value: 'shift', label: 'Shift (8h)' },
    { value: 'day', label: 'Day', shortcut: 'Ctrl+T' },
    { value: 'week', label: 'Week', shortcut: 'Ctrl+W' },
    { value: 'twoWeeks', label: 'Two Weeks', shortcut: 'Ctrl+Shift+T' },
    { value: 'month', label: 'Month', shortcut: 'Ctrl+M' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year', shortcut: 'Ctrl+Y' },
  ];

  const fadeModes: { value: FadeMode; label: string; description: string }[] = [
    { value: 'none', label: 'None', description: 'No fade effect' },
    { value: 'job', label: 'Job', description: 'Fade in all activities of the same job' },
    { value: 'operation', label: 'Operation', description: 'Fade in all activities of the same operation' },
    { value: 'activity', label: 'Activity', description: 'Fade in only the selected activity' },
    { value: 'inventory', label: 'Inventory', description: 'Fade in activities with common inventory' },
    { value: 'all-relations', label: 'All Relations', description: 'Fade in all related activities' },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-background">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onResizeToFit}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Resize to fit rows</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = zoomLevels.findIndex(z => z.value === zoomLevel);
                  if (currentIndex > 0) {
                    onZoomChange(zoomLevels[currentIndex - 1].value);
                  }
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = zoomLevels.findIndex(z => z.value === zoomLevel);
                  if (currentIndex < zoomLevels.length - 1) {
                    onZoomChange(zoomLevels[currentIndex + 1].value);
                  }
                }}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                {zoomLevels.find(z => z.value === zoomLevel)?.label}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Zoom Level</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {zoomLevels.map(level => (
                <DropdownMenuItem
                  key={level.value}
                  onClick={() => onZoomChange(level.value)}
                >
                  <span className="flex-1">{level.label}</span>
                  {level.shortcut && (
                    <span className="text-xs text-muted-foreground ml-2">{level.shortcut}</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Variable Zoom */}
        <div className="flex items-center gap-2 px-2 border-x">
          <Switch
            checked={variableZoom}
            onCheckedChange={onVariableZoomToggle}
            id="variable-zoom"
          />
          <Label htmlFor="variable-zoom" className="text-sm">Variable Zoom</Label>
          {variableZoom && (
            <Input
              type="number"
              min="1"
              max="10"
              value={variableZoomFactor}
              onChange={(e) => onVariableZoomFactorChange(Number(e.target.value))}
              className="w-16 h-8"
            />
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-1">
          {showJobSearch ? (
            <div className="flex items-center gap-1">
              <Input
                placeholder="Search job..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onJobSearch(jobSearchQuery);
                  } else if (e.key === 'Escape') {
                    setShowJobSearch(false);
                    setJobSearchQuery('');
                  }
                }}
                className="w-40 h-8"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowJobSearch(false);
                  setJobSearchQuery('');
                }}
              >
                ×
              </Button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJobSearch(true)}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Job
                </Button>
              </TooltipTrigger>
              <TooltipContent>Find a job (Name or External ID)</TooltipContent>
            </Tooltip>
          )}

          {showResourceSearch ? (
            <div className="flex items-center gap-1">
              <Input
                placeholder="Search resource..."
                value={resourceSearchQuery}
                onChange={(e) => setResourceSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onResourceSearch(resourceSearchQuery);
                  } else if (e.key === 'Escape') {
                    setShowResourceSearch(false);
                    setResourceSearchQuery('');
                  }
                }}
                className="w-40 h-8"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResourceSearch(false);
                  setResourceSearchQuery('');
                }}
              >
                ×
              </Button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResourceSearch(true)}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Resource
                </Button>
              </TooltipTrigger>
              <TooltipContent>Find a resource by name</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Print/Export */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print Gantt</TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            Export PDF
          </Button>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2 px-2 border-x">
          <Switch
            checked={showTooltips}
            onCheckedChange={onTooltipsToggle}
            id="tooltips"
          />
          <Label htmlFor="tooltips" className="text-sm">Tooltips</Label>
        </div>

        {/* Fade Mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {fadeMode === 'none' ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Fade
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Fade Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fadeModes.map(mode => (
              <DropdownMenuItem
                key={mode.value}
                onClick={() => onFadeModeChange(mode.value)}
              >
                <div>
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs text-muted-foreground">{mode.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Options
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Gantt Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="anchor-drop" className="text-sm font-normal">
                  Anchor activities after drag-and-drop
                </Label>
                <Switch
                  id="anchor-drop"
                  checked={anchorOnDrop}
                  onCheckedChange={onAnchorOnDropToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="lock-drop" className="text-sm font-normal">
                  Lock activities to resources after drag-and-drop
                </Label>
                <Switch
                  id="lock-drop"
                  checked={lockOnDrop}
                  onCheckedChange={onLockOnDropToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="expedite" className="text-sm font-normal">
                  Expedite successors after move
                </Label>
                <Switch
                  id="expedite"
                  checked={expediteSuccessors}
                  onCheckedChange={onExpediteSuccessorsToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hints" className="text-sm font-normal">
                  Show scheduling hints
                </Label>
                <Switch
                  id="hints"
                  checked={showSchedulingHints}
                  onCheckedChange={onSchedulingHintsToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="links" className="text-sm font-normal">
                  Show activity links
                </Label>
                <Switch
                  id="links"
                  checked={showActivityLinks}
                  onCheckedChange={onActivityLinksToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="daily" className="text-sm font-normal">
                  View as daily activities
                </Label>
                <Switch
                  id="daily"
                  checked={dailyView}
                  onCheckedChange={onDailyViewToggle}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Display Settings */}
        <Button
          variant="outline"
          size="sm"
          onClick={onDisplaySettings}
        >
          <Layers className="h-4 w-4 mr-1" />
          Display Settings
        </Button>
      </div>
    </TooltipProvider>
  );
}