import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, Plus, Trash2 } from "lucide-react";

export interface FormatRule {
  id: string;
  column: string;
  condition: 'equals' | 'greater' | 'less' | 'contains' | 'between';
  value: string;
  value2?: string;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
}

interface FormatRulesPanelProps {
  formatRules: FormatRule[];
  onAddRule: () => void;
  onUpdateRule: (id: string, updates: Partial<FormatRule>) => void;
  onDeleteRule: (id: string) => void;
  availableColumns: string[];
}

export const FormatRulesPanel = memo(({
  formatRules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  availableColumns
}: FormatRulesPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Conditional Formatting
        </CardTitle>
        <CardDescription>
          Apply formatting rules based on data values
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {formatRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 border rounded-lg space-y-3 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {/* Column selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Column</Label>
                    <Select
                      value={rule.column}
                      onValueChange={(value) => onUpdateRule(rule.id, { column: value })}
                      data-testid={`select-format-column-${rule.id}`}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Condition</Label>
                    <Select
                      value={rule.condition}
                      onValueChange={(value) => 
                        onUpdateRule(rule.id, { condition: value as FormatRule['condition'] })
                      }
                      data-testid={`select-format-condition-${rule.id}`}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Value inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="text"
                      value={rule.value}
                      onChange={(e) => onUpdateRule(rule.id, { value: e.target.value })}
                      placeholder="Enter value"
                      className="h-8"
                      data-testid={`input-format-value-${rule.id}`}
                    />
                  </div>
                  
                  {rule.condition === 'between' && (
                    <div>
                      <Label className="text-xs">Value 2</Label>
                      <Input
                        type="text"
                        value={rule.value2 || ''}
                        onChange={(e) => onUpdateRule(rule.id, { value2: e.target.value })}
                        placeholder="Enter value"
                        className="h-8"
                        data-testid={`input-format-value2-${rule.id}`}
                      />
                    </div>
                  )}
                </div>

                {/* Formatting options */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Background</Label>
                    <Input
                      type="color"
                      value={rule.backgroundColor || '#ffffff'}
                      onChange={(e) => onUpdateRule(rule.id, { backgroundColor: e.target.value })}
                      className="h-8 w-full cursor-pointer"
                      data-testid={`input-format-bg-${rule.id}`}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Text Color</Label>
                    <Input
                      type="color"
                      value={rule.textColor || '#000000'}
                      onChange={(e) => onUpdateRule(rule.id, { textColor: e.target.value })}
                      className="h-8 w-full cursor-pointer"
                      data-testid={`input-format-text-${rule.id}`}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Font Weight</Label>
                    <Select
                      value={rule.fontWeight || 'normal'}
                      onValueChange={(value) => 
                        onUpdateRule(rule.id, { fontWeight: value as 'normal' | 'bold' })
                      }
                      data-testid={`select-format-weight-${rule.id}`}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Delete button */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteRule(rule.id)}
                    className="text-red-500 hover:text-red-700"
                    data-testid={`button-delete-rule-${rule.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {formatRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No formatting rules defined
              </div>
            )}
          </div>
        </ScrollArea>
        
        <Button
          onClick={onAddRule}
          variant="outline"
          className="w-full mt-4"
          data-testid="button-add-format-rule"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </CardContent>
    </Card>
  );
});

FormatRulesPanel.displayName = 'FormatRulesPanel';