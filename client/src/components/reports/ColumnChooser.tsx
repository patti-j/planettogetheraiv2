import { useState, useEffect, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Columns3 } from "lucide-react";

interface ColumnChooserProps {
  allColumns: string[];
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;
}

export const ColumnChooser = memo(({
  allColumns,
  selectedColumns,
  onColumnsChange,
  columnOrder,
  onColumnOrderChange
}: ColumnChooserProps) => {
  // Dialog state
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [hiddenColumnsSearch, setHiddenColumnsSearch] = useState("");
  const [shownColumnsSearch, setShownColumnsSearch] = useState("");
  const [selectedHiddenColumns, setSelectedHiddenColumns] = useState<string[]>([]);
  const [selectedShownColumns, setSelectedShownColumns] = useState<string[]>([]);
  const [isDraggingColumn, setIsDraggingColumn] = useState<string | null>(null);
  
  // Local state for managing columns during dialog interaction
  const [localSelectedColumns, setLocalSelectedColumns] = useState<string[]>(selectedColumns);
  const [localColumnOrder, setLocalColumnOrder] = useState<string[]>(columnOrder);
  
  // Reset local state when dialog opens
  useEffect(() => {
    if (showColumnChooser) {
      setLocalSelectedColumns(selectedColumns);
      setLocalColumnOrder(columnOrder);
      setSelectedHiddenColumns([]);
      setSelectedShownColumns([]);
      setHiddenColumnsSearch("");
      setShownColumnsSearch("");
    }
  }, [showColumnChooser, selectedColumns, columnOrder]);

  const handleColumnReorder = (fromIndex: number, toIndex: number) => {
    const newOrder = [...localColumnOrder];
    const [movedColumn] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedColumn);
    setLocalColumnOrder(newOrder);
  };

  const handleSave = () => {
    onColumnsChange(localSelectedColumns);
    onColumnOrderChange(localColumnOrder);
    setShowColumnChooser(false);
  };

  const handleCancel = () => {
    setShowColumnChooser(false);
  };
  
  // Get hidden columns based on local state
  const hiddenColumns = localColumnOrder.filter(col => !localSelectedColumns.includes(col));
  const shownColumns = localColumnOrder.filter(col => localSelectedColumns.includes(col));
  
  return (
    <>
      {/* Button to trigger the dialog */}
      <Button 
        onClick={() => setShowColumnChooser(true)}
        variant="outline"
        data-testid="column-chooser-button"
      >
        <Columns3 className="w-4 h-4 mr-2" />
        Columns ({selectedColumns.length}/{allColumns.length})
      </Button>

      {/* Column Chooser Dialog */}
      <Dialog open={showColumnChooser} onOpenChange={setShowColumnChooser}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Column Chooser</DialogTitle>
            <DialogDescription>
              Drag and drop columns between panels or double-click to move them. 
              Use the arrow buttons to move selected columns.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
            {/* Hidden Columns Panel */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Hidden Columns ({hiddenColumns.length}):</div>
              <Input
                placeholder="Search columns..."
                value={hiddenColumnsSearch}
                onChange={(e) => setHiddenColumnsSearch(e.target.value)}
                className="h-8"
                data-testid="hidden-columns-search"
              />
              <div 
                className="border rounded-lg p-2 h-80 overflow-y-auto bg-background"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnName = e.dataTransfer.getData("text/plain");
                  if (columnName && localSelectedColumns.includes(columnName)) {
                    setLocalSelectedColumns(prev => prev.filter(c => c !== columnName));
                    setSelectedShownColumns([]);
                  }
                }}
                data-testid="hidden-columns-panel"
              >
                {hiddenColumns.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No hidden columns
                  </div>
                )}
                {hiddenColumns
                  .filter(colName => 
                    colName.toLowerCase().includes(hiddenColumnsSearch.toLowerCase())
                  )
                  .map(colName => (
                    <div
                      key={colName}
                      className={`px-2 py-1.5 rounded cursor-pointer select-none mb-1
                        transition-colors ${
                        selectedHiddenColumns.includes(colName) 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'hover:bg-accent border border-transparent'
                      }`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", colName);
                        setIsDraggingColumn(colName);
                      }}
                      onDragEnd={() => setIsDraggingColumn(null)}
                      onClick={() => {
                        setSelectedHiddenColumns(prev => 
                          prev.includes(colName)
                            ? prev.filter(c => c !== colName)
                            : [...prev, colName]
                        );
                        setSelectedShownColumns([]);
                      }}
                      onDoubleClick={() => {
                        setLocalSelectedColumns(prev => [...prev, colName]);
                        setSelectedHiddenColumns(prev => 
                          prev.filter(c => c !== colName)
                        );
                      }}
                      data-testid={`hidden-column-${colName}`}
                    >
                      <div className="text-sm truncate">{colName}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Arrow Buttons */}
            <div className="flex flex-col justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setLocalSelectedColumns(prev => [...prev, ...selectedHiddenColumns]);
                  setSelectedHiddenColumns([]);
                }}
                disabled={selectedHiddenColumns.length === 0}
                className="h-8 w-8"
                title="Show selected columns"
                data-testid="show-columns-button"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setLocalSelectedColumns(prev => 
                    prev.filter(c => !selectedShownColumns.includes(c))
                  );
                  setSelectedShownColumns([]);
                }}
                disabled={selectedShownColumns.length === 0}
                className="h-8 w-8"
                title="Hide selected columns"
                data-testid="hide-columns-button"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Shown Columns Panel */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Shown Columns ({shownColumns.length}):</div>
              <Input
                placeholder="Search columns..."
                value={shownColumnsSearch}
                onChange={(e) => setShownColumnsSearch(e.target.value)}
                className="h-8"
                data-testid="shown-columns-search"
              />
              <div 
                className="border rounded-lg p-2 h-80 overflow-y-auto bg-background"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnName = e.dataTransfer.getData("text/plain");
                  if (columnName && !localSelectedColumns.includes(columnName)) {
                    setLocalSelectedColumns(prev => [...prev, columnName]);
                    setSelectedHiddenColumns([]);
                  }
                }}
                data-testid="shown-columns-panel"
              >
                {shownColumns.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No columns selected
                  </div>
                )}
                {shownColumns
                  .filter(colName => 
                    colName.toLowerCase().includes(shownColumnsSearch.toLowerCase())
                  )
                  .map((colName, index) => (
                    <div
                      key={colName}
                      className={`px-2 py-1.5 rounded cursor-pointer select-none mb-1
                        transition-colors ${
                        selectedShownColumns.includes(colName) 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'hover:bg-accent border border-transparent'
                      } ${isDraggingColumn === colName ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", colName);
                        setIsDraggingColumn(colName);
                      }}
                      onDragEnd={() => setIsDraggingColumn(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        // Visual feedback for reordering
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const height = rect.height;
                        if (y < height / 2) {
                          e.currentTarget.style.borderTop = '2px solid hsl(var(--primary))';
                          e.currentTarget.style.borderBottom = '';
                        } else {
                          e.currentTarget.style.borderTop = '';
                          e.currentTarget.style.borderBottom = '2px solid hsl(var(--primary))';
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.style.borderTop = '';
                        e.currentTarget.style.borderBottom = '';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderTop = '';
                        e.currentTarget.style.borderBottom = '';
                        const draggedColumn = e.dataTransfer.getData("text/plain");
                        if (draggedColumn && draggedColumn !== colName) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const height = rect.height;
                          const draggedIndex = localColumnOrder.indexOf(draggedColumn);
                          const targetIndex = localColumnOrder.indexOf(colName);
                          
                          if (y < height / 2) {
                            // Insert before
                            handleColumnReorder(draggedIndex, targetIndex);
                          } else {
                            // Insert after
                            handleColumnReorder(draggedIndex, targetIndex + (draggedIndex < targetIndex ? 0 : 1));
                          }
                        }
                      }}
                      onClick={() => {
                        setSelectedShownColumns(prev => 
                          prev.includes(colName)
                            ? prev.filter(c => c !== colName)
                            : [...prev, colName]
                        );
                        setSelectedHiddenColumns([]);
                      }}
                      onDoubleClick={() => {
                        setLocalSelectedColumns(prev => 
                          prev.filter(c => c !== colName)
                        );
                        setSelectedShownColumns(prev => 
                          prev.filter(c => c !== colName)
                        );
                      }}
                      data-testid={`shown-column-${colName}`}
                    >
                      <div className="text-sm truncate">{colName}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Tip: Hold Ctrl/Cmd to select multiple columns. Drag columns within the shown panel to reorder them.
          </div>

          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              data-testid="column-chooser-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              data-testid="column-chooser-save"
            >
              Save and Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

ColumnChooser.displayName = 'ColumnChooser';