import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, ArrowDown, GripVertical, Columns, Group, Calculator } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnConfiguratorProps {
  tableSchema: Array<{
    columnName: string;
    dataType: string;
    isNullable: string;
    maxLength: number | null;
  }> | null;
  selectedColumns: string[];
  onColumnToggle: (column: string) => void;
  onColumnsReorder: (columns: string[]) => void;
  groupingEnabled: boolean;
  onGroupingToggle: (enabled: boolean) => void;
  groupingColumns: string[];
  onGroupingColumnToggle: (column: string) => void;
  includeTotals: boolean;
  onTotalsToggle: (enabled: boolean) => void;
}

// Sortable column item
const SortableColumn = ({ column, isSelected, onToggle }: { 
  column: string; 
  isSelected: boolean; 
  onToggle: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <Checkbox
        id={`col-${column}`}
        checked={isSelected}
        onCheckedChange={onToggle}
        data-testid={`checkbox-column-${column}`}
      />
      <label
        htmlFor={`col-${column}`}
        className="text-sm flex-grow cursor-pointer"
      >
        {column}
      </label>
    </div>
  );
};

export const ColumnConfigurator = memo(({
  tableSchema,
  selectedColumns,
  onColumnToggle,
  onColumnsReorder,
  groupingEnabled,
  onGroupingToggle,
  groupingColumns,
  onGroupingColumnToggle,
  includeTotals,
  onTotalsToggle
}: ColumnConfiguratorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && tableSchema) {
      const oldIndex = selectedColumns.indexOf(active.id);
      const newIndex = selectedColumns.indexOf(over.id);
      onColumnsReorder(arrayMove(selectedColumns, oldIndex, newIndex));
    }
  };

  const selectAllColumns = () => {
    if (tableSchema) {
      const allColumns = tableSchema.map(col => col.columnName);
      allColumns.forEach(col => {
        if (!selectedColumns.includes(col)) {
          onColumnToggle(col);
        }
      });
    }
  };

  const deselectAllColumns = () => {
    selectedColumns.forEach(col => onColumnToggle(col));
  };

  const numericColumns = tableSchema?.filter(col => 
    ['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint'].some(type =>
      col.dataType.toLowerCase().includes(type)
    )
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Columns className="h-4 w-4" />
          Column Configuration
        </CardTitle>
        <CardDescription>
          Select and arrange columns for your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column selection and ordering */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Select Columns</Label>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllColumns}
                data-testid="button-select-all"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllColumns}
                data-testid="button-deselect-all"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-48 border rounded-md p-2">
            {tableSchema && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedColumns}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedColumns.map(column => (
                    <SortableColumn
                      key={column}
                      column={column}
                      isSelected={true}
                      onToggle={() => onColumnToggle(column)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
            
            {/* Show unselected columns at the bottom */}
            {tableSchema?.filter(col => !selectedColumns.includes(col.columnName))
              .map(col => (
                <div
                  key={col.columnName}
                  className="flex items-center space-x-2 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded opacity-60"
                >
                  <div className="w-4" />
                  <Checkbox
                    id={`col-${col.columnName}`}
                    checked={false}
                    onCheckedChange={() => onColumnToggle(col.columnName)}
                    data-testid={`checkbox-column-${col.columnName}`}
                  />
                  <label
                    htmlFor={`col-${col.columnName}`}
                    className="text-sm flex-grow cursor-pointer"
                  >
                    {col.columnName}
                  </label>
                </div>
              ))}
          </ScrollArea>
        </div>

        {/* Grouping configuration */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Group className="h-4 w-4" />
              <Label htmlFor="grouping-toggle">Enable Grouping</Label>
            </div>
            <Switch
              id="grouping-toggle"
              checked={groupingEnabled}
              onCheckedChange={onGroupingToggle}
              data-testid="switch-grouping"
            />
          </div>
          
          {groupingEnabled && (
            <div className="space-y-2 ml-6">
              <Label className="text-sm text-muted-foreground">Group By Columns</Label>
              <div className="space-y-1">
                {selectedColumns.map(column => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${column}`}
                      checked={groupingColumns.includes(column)}
                      onCheckedChange={() => onGroupingColumnToggle(column)}
                      data-testid={`checkbox-group-${column}`}
                    />
                    <label
                      htmlFor={`group-${column}`}
                      className="text-sm cursor-pointer"
                    >
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totals configuration */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <Label htmlFor="totals-toggle">Include Totals</Label>
            </div>
            <Switch
              id="totals-toggle"
              checked={includeTotals}
              onCheckedChange={onTotalsToggle}
              data-testid="switch-totals"
              disabled={numericColumns.length === 0}
            />
          </div>
          {numericColumns.length === 0 && (
            <p className="text-sm text-muted-foreground ml-6">
              No numeric columns available for totals
            </p>
          )}
          {includeTotals && numericColumns.length > 0 && (
            <p className="text-sm text-muted-foreground ml-6">
              Totals will be calculated for: {numericColumns.map(c => c.columnName).join(', ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ColumnConfigurator.displayName = 'ColumnConfigurator';