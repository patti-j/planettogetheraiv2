import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

interface FilterSearchWidgetProps {
  // Search configuration
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;

  // Filter configuration
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    selectedValue?: string;
    onValueChange?: (value: string) => void;
  }[];
  showFilters?: boolean;

  // Sort configuration
  sortOptions?: SortOption[];
  selectedSort?: string;
  onSortChange?: (value: string) => void;
  showSort?: boolean;

  // Active filters display
  activeFilters?: { label: string; value: string; onRemove: () => void }[];
  showActiveFilters?: boolean;

  // Layout configuration
  layout?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
  title?: string;
  showClearAll?: boolean;
  onClearAll?: () => void;
}

export default function FilterSearchWidget({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filters = [],
  showFilters = true,
  sortOptions = [],
  selectedSort,
  onSortChange,
  showSort = false,
  activeFilters = [],
  showActiveFilters = true,
  layout = 'horizontal',
  className = '',
  title,
  showClearAll = true,
  onClearAll
}: FilterSearchWidgetProps) {
  const hasActiveFilters = activeFilters.length > 0 || searchValue.trim().length > 0;

  const renderSearchInput = () => {
    if (!showSearch) return null;

    return (
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10"
        />
      </div>
    );
  };

  const renderFilters = () => {
    if (!showFilters || filters.length === 0) return null;

    return (
      <>
        {filters.map((filter, index) => (
          <Select
            key={index}
            value={filter.selectedValue || 'all'}
            onValueChange={filter.onValueChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {filter.label}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </>
    );
  };

  const renderSort = () => {
    if (!showSort || sortOptions.length === 0) return null;

    return (
      <Select value={selectedSort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              {selectedSort?.includes('desc') ? (
                <SortDesc className="w-4 h-4" />
              ) : (
                <SortAsc className="w-4 h-4" />
              )}
              Sort
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.direction === 'desc' ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderActiveFilters = () => {
    if (!showActiveFilters || !hasActiveFilters) return null;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {searchValue.trim() && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Search className="w-3 h-3" />
            "{searchValue}"
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onSearchChange?.('')}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        )}
        {activeFilters.map((filter, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1">
            {filter.label}: {filter.value}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={filter.onRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
        {showClearAll && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {/* Main Controls */}
      <div className={`flex gap-4 ${
        layout === 'vertical' ? 'flex-col' : 
        layout === 'compact' ? 'flex-wrap' : 
        'flex-col sm:flex-row'
      }`}>
        {renderSearchInput()}
        <div className="flex gap-2 flex-wrap">
          {renderFilters()}
          {renderSort()}
        </div>
      </div>

      {/* Active Filters */}
      {renderActiveFilters()}
    </div>
  );

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}