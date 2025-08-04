# Production Planning Page Widget Migration Example

This example demonstrates how the production planning page was migrated to use common reusable widgets.

## Before Migration

The page used individual components scattered throughout:

```tsx
// Metrics cards were individually coded
<Card className="p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">Total Plans</p>
      <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
    </div>
    <div className="p-3 bg-blue-100 rounded-full">
      <FileText className="w-6 h-6 text-blue-600" />
    </div>
  </div>
</Card>

// Filter controls were manually implemented
<div className="flex flex-wrap gap-3">
  <div>
    <Label htmlFor="search" className="text-sm font-medium">Search</Label>
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search plans..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8 w-40"
      />
    </div>
  </div>
  <Select value={filterPlant} onValueChange={setFilterPlant}>
    <SelectTrigger className="w-40">
      <SelectValue placeholder="All Plants" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Plants</SelectItem>
      {plants.map((plant) => (
        <SelectItem key={plant.id} value={plant.id.toString()}>
          {plant.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// Action buttons were individual Button components
<div className="flex flex-wrap gap-2">
  <Button
    variant={viewMode === 'timeline' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('timeline')}
  >
    <ArrowRight className="w-4 h-4" />
    Timeline
  </Button>
  <Button
    variant={viewMode === 'calendar' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('calendar')}
  >
    <Calendar className="w-4 h-4" />
    Calendar
  </Button>
</div>
```

## After Migration

Using reusable widget components:

```tsx
// Import common widgets
import { 
  FilterSearchWidget, 
  MetricsCardWidget, 
  StatusIndicatorWidget, 
  DataTableWidget,
  ActionButtonsWidget 
} from '@/components/widgets/common';

// Metrics cards using MetricsCardWidget
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricsCardWidget
    title="Total Plans"
    value={plans.length}
    icon="file"
    color="blue"
    variant="default"
  />
  
  <MetricsCardWidget
    title="Active Plans"
    value={plans.filter(p => p.status === 'active').length}
    icon="check"
    color="green"
    variant="default"
    change={{
      value: 12,
      label: "vs last month",
      direction: "up",
      isPercentage: true
    }}
  />
</div>

// Filter controls using FilterSearchWidget
<FilterSearchWidget
  title="Planning Controls & Filters"
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="Search production plans..."
  filters={[
    {
      label: "Plant",
      value: "plant",
      options: plants.map(plant => ({ 
        value: plant.id.toString(), 
        label: plant.name,
        count: plans.filter(p => p.plantId === plant.id).length
      })),
      selectedValue: filterPlant,
      onValueChange: setFilterPlant
    },
    {
      label: "Status",
      value: "status",
      options: [
        { value: "active", label: "Active", count: plans.filter(p => p.status === 'active').length },
        { value: "completed", label: "Completed", count: plans.filter(p => p.status === 'completed').length }
      ],
      selectedValue: filterStatus,
      onValueChange: setFilterStatus
    }
  ]}
  activeFilters={[
    ...(searchTerm ? [{ label: "Search", value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
    ...(filterPlant !== 'all' ? [{ label: "Plant", value: filterPlant, onRemove: () => setFilterPlant('all') }] : [])
  ]}
  onClearAll={() => {
    setSearchTerm('');
    setFilterPlant('all');
  }}
/>

// Action buttons using ActionButtonsWidget
<ActionButtonsWidget
  title="View Controls"
  actions={[
    {
      id: 'timeline',
      label: 'Timeline',
      icon: ArrowRight,
      onClick: () => setViewMode('timeline'),
      variant: viewMode === 'timeline' ? 'default' : 'outline',
      size: 'sm'
    },
    {
      id: 'calendar',
      label: 'Calendar', 
      icon: Calendar,
      onClick: () => setViewMode('calendar'),
      variant: viewMode === 'calendar' ? 'default' : 'outline',
      size: 'sm'
    }
  ]}
  layout="horizontal"
  variant="compact"
/>
```

## Benefits of Migration

1. **Code Reusability**: Common UI patterns are now reusable across all pages
2. **Consistency**: All filter controls, metrics cards, and action buttons look and behave consistently
3. **Maintainability**: Changes to common patterns only need to be made in one place
4. **Feature Rich**: Widgets include advanced features like active filter display, sorting, progress indicators
5. **Accessibility**: Widgets follow consistent accessibility patterns
6. **Responsive**: All widgets are mobile-responsive by default

## Migration Steps

1. **Identify Common Patterns**: Look for repeated UI patterns across pages
2. **Extract to Widgets**: Create reusable widget components with flexible props
3. **Replace Implementations**: Replace individual implementations with widget usage
4. **Test Functionality**: Ensure all features work with new widget implementations
5. **Cleanup**: Remove unused individual component code

## Available Common Widgets

- **FilterSearchWidget**: Search input + filter dropdowns + active filters display
- **MetricsCardWidget**: Metrics display with icons, progress, trends, and different variants
- **StatusIndicatorWidget**: Status badges, indicators, and progress displays
- **DataTableWidget**: Full-featured data tables with sorting, filtering, pagination
- **ActionButtonsWidget**: Button groups with dropdown overflow and different layouts
- **KanbanCardWidget**: Draggable cards for kanban boards with custom fields

## Usage Guidelines

- Always import from `@/components/widgets/common`
- Use TypeScript interfaces for proper type checking
- Configure widgets through props rather than styling directly
- Leverage built-in responsive behavior
- Use consistent color schemes across widgets