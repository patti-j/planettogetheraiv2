# Reusable Widget Components

This directory contains reusable widget components that provide common UI patterns across the manufacturing ERP system.

## Available Widgets

### Common Widgets (`./common/`)

1. **FilterSearchWidget** - Search input with filter dropdowns and active filters display
2. **MetricsCardWidget** - Metrics display with icons, progress bars, trends, and change indicators  
3. **StatusIndicatorWidget** - Status badges, indicators, and progress displays
4. **DataTableWidget** - Full-featured data tables with sorting, filtering, pagination, and actions
5. **ActionButtonsWidget** - Button groups with dropdown overflow and different layouts
6. **KanbanCardWidget** - Draggable cards for kanban boards with custom fields

## Usage

```tsx
import { 
  FilterSearchWidget, 
  MetricsCardWidget, 
  StatusIndicatorWidget, 
  DataTableWidget,
  ActionButtonsWidget,
  KanbanCardWidget 
} from '@/components/widgets/common';
```

## Migration Examples

See `./migration-examples/` for detailed examples of how existing pages were migrated to use these reusable widgets.

### Key Migration Benefits

- **Code Reusability**: Common UI patterns are reusable across all pages
- **Consistency**: All components look and behave consistently
- **Maintainability**: Changes to common patterns only need to be made in one place
- **Feature Rich**: Widgets include advanced features like filtering, sorting, progress indicators
- **Accessibility**: Widgets follow consistent accessibility patterns
- **Mobile Responsive**: All widgets are mobile-responsive by default

## Widget Features

### FilterSearchWidget
- Search input with customizable placeholder
- Multiple filter dropdowns with counts
- Active filters display with remove buttons
- Clear all functionality
- Responsive layout options

### MetricsCardWidget
- Multiple variants (default, compact, detailed, minimal)
- Icon support with color themes
- Progress indicators
- Trend/change indicators with direction
- Badge support
- Customizable sizes

### StatusIndicatorWidget
- Multiple display modes (badge, card, indicator, list, progress)
- Priority levels with color coding
- Custom status configurations
- Progress tracking
- Click handlers

### DataTableWidget
- Search functionality across columns
- Column-based filtering
- Sorting with direction indicators
- Pagination
- Row selection (single/multiple)
- Bulk actions
- Row actions dropdown
- Loading states
- Empty states
- Responsive design

### ActionButtonsWidget
- Multiple layout options (horizontal, vertical, grid, dropdown, mixed)
- Primary and secondary actions
- Grouped actions with separators
- Icon support
- Badge indicators
- Responsive behavior with overflow handling

### KanbanCardWidget
- Drag and drop support
- Custom field display
- Action dropdown
- Status and priority indicators
- Responsive card layout
- Click handlers

## Customization

All widgets support extensive customization through props:
- Layout options
- Color themes
- Size variants
- Custom styling via className
- Event handlers
- Responsive behavior

## Best Practices

1. **Import from common index**: Always import from `@/components/widgets/common`
2. **Use TypeScript interfaces**: Leverage provided interfaces for type safety
3. **Configure through props**: Avoid direct styling, use prop configuration
4. **Consistent color schemes**: Use the built-in color themes
5. **Test responsiveness**: Verify behavior on mobile and desktop
6. **Handle loading states**: Use loading props for async operations
7. **Provide accessibility**: Use proper labels and ARIA attributes