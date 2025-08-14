# PT Import Tables Comparison

## SQL Script Tables (59 total):
1. AllowedHelpers ✓
2. AttributeCodeTableAttrCodes ✓
3. AttributeCodeTableAttrNames ✓
4. AttributeCodeTableResources ✓
5. AttributeCodeTables ✓
6. AttributeRangeTableAttrNames ✓
7. AttributeRangeTableFrom ✓
8. AttributeRangeTableResources ✓
9. AttributeRangeTables ✓
10. AttributeRangeTableTo ✓
11. Attributes ✓
12. Capabilities ✓
13. CapacityIntervalResources ✓
14. CapacityIntervals ✓
15. Cells ✓
16. CleanoutTriggerTableOpCount ✓
17. CleanoutTriggerTableProdUnits ✓
18. CleanoutTriggerTableResources ✓
19. CleanoutTriggerTables ✓
20. CleanoutTriggerTableTime ✓
21. CompatibilityCodes ✓
22. CompatibilityCodeTableResources ✓
23. CompatibilityCodeTables ✓
24. CustomerConnections ✓
25. Customers ✓
26. Departments ✓
27. **ForecastShipments** ❌ MISSING
28. Forecasts ✓
29. Inventories ✓
30. Items ✓
31. JobActivities ✓
32. JobMaterials ✓
33. JobOperationAttributes ✓
34. JobOperations ✓
35. JobPathNodes ✓
36. JobPaths ✓
37. JobProducts ✓
38. JobResourceCapabilities ✓
39. JobResources ✓
40. Jobs ✓
41. **JobSuccessorManufacturingOrders** ❌ MISSING
42. **Lots** ❌ MISSING
43. **ManufacturingOrders** ❌ MISSING
44. Plants ✓
45. PlantWarehouses ✓
46. ProductRules ✓
47. PurchasesToStock ✓
48. RecurringCapacityIntervals ✓
49. ResourceCapabilities ✓
50. ResourceConnections ✓
51. ResourceConnectors ✓
52. Resources ✓
53. SalesOrderLineDistributions ✓
54. SalesOrderLines ✓
55. SalesOrders ✓
56. TransferOrderDistributions ✓
57. TransferOrders ✓
58. Users ✓
59. Warehouses ✓

## Current Database Tables (55 total):
All 55 tables match the SQL script except for the 4 missing tables listed above.

## Missing Tables Summary:
1. **ForecastShipments** - Forecast shipment data
2. **JobSuccessorManufacturingOrders** - Job successor relationships to manufacturing orders
3. **Lots** - Lot/batch tracking information
4. **ManufacturingOrders** - Manufacturing order master data

## Conclusion:
We are missing exactly 4 tables from the SQL script: ForecastShipments, JobSuccessorManufacturingOrders, Lots, and ManufacturingOrders.
This accounts for the difference: 59 (SQL script) - 55 (current database) = 4 missing tables.