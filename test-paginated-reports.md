# Testing Paginated Reports - Column Selection Fix

## Test Scenario: Switching Between Tables

### Before Fix
1. Select table "publish.DASHt_HistoricalKPIs" 
2. Columns shown: ItemId, WarehouseId, Quantity, UnitOfMeasure (from previous Inventory table)
3. Result: **Table shows blank because columns don't match data**

### After Fix
1. Select any table
2. Columns automatically reset to first 5 columns from the selected table's schema
3. Column filters are cleared
4. Page resets to 1
5. Result: **Table shows data correctly with matching columns**

## Test Results
✅ Fixed: When switching tables, selectedColumns now resets to match the new table's schema
✅ Column filters are cleared when switching tables
✅ Pagination resets to page 1

## Code Changes
Updated useEffect in `client/src/pages/paginated-reports.tsx`:
- Now always resets columns when tableSchema changes (not just when empty)
- Clears column filters
- Resets pagination to page 1