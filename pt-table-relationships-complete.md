# Complete PT Import Table Relationships

## Overview
This document provides comprehensive relationship recommendations for all 59 PT (PlanetTogether) import tables, following the hierarchical manufacturing data model: **Plants → Departments → Resources → Jobs → Operations**.

## Core Hierarchical Relationships

### 1. **ptPlants** (Master Location Data)
**Primary Key**: `external_id`
**Relationships**: 
- **Parent to**: `ptDepartments`, `ptPlantWarehouses`, `ptResources`, `ptJobs`, `ptManufacturingOrders`
- **Key Connections**: Core entity for plant-specific data across all manufacturing operations

### 2. **ptDepartments** (Production Areas)
**Primary Key**: `external_id`
**Foreign Keys**: `plant_external_id` → `ptPlants.external_id`
**Relationships**:
- **Parent to**: `ptResources`, `ptCells`
- **Child of**: `ptPlants`
- **Cross-Reference**: `ptAllowedHelpers`, `ptJobResources`

### 3. **ptResources** (Manufacturing Equipment/Workstations)
**Primary Key**: `external_id`
**Foreign Keys**: 
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
**Relationships**:
- **Parent to**: `ptJobResources`, `ptResourceCapabilities`, `ptResourceConnections`
- **Child of**: `ptDepartments`, `ptPlants`
- **Many-to-Many**: `ptCapabilities` (via `ptResourceCapabilities`)

## Job & Manufacturing Order Relationships

### 4. **ptJobs** (Production Templates/Recipes)
**Primary Key**: `external_id`
**Foreign Keys**: `item_external_id` → `ptItems.external_id`
**Relationships**:
- **Parent to**: `ptJobOperations`, `ptJobPaths`, `ptJobMaterials`, `ptJobProducts`, `ptJobActivities`
- **Child of**: `ptItems`
- **Related to**: `ptManufacturingOrders` (via `job_external_id`)

### 5. **ptManufacturingOrders** (Actual Production Orders)
**Primary Key**: `external_id`
**Foreign Keys**: 
- `job_external_id` → `ptJobs.external_id`
- `locked_plant_external_id` → `ptPlants.external_id`
**Relationships**:
- **Child of**: `ptJobs`
- **Related to**: `ptJobSuccessorManufacturingOrders`, `ptSalesOrders`

### 6. **ptJobOperations** (Operation Templates)
**Primary Key**: `external_id`
**Foreign Keys**: 
- `job_external_id` → `ptJobs.external_id`
- `path_external_id` → `ptJobPaths.external_id`
**Relationships**:
- **Parent to**: `ptJobOperationAttributes`, `ptJobResources`
- **Child of**: `ptJobs`, `ptJobPaths`

### 7. **ptJobPaths** (Routing Definitions)
**Primary Key**: `external_id`
**Foreign Keys**: `job_external_id` → `ptJobs.external_id`
**Relationships**:
- **Parent to**: `ptJobOperations`, `ptJobPathNodes`
- **Child of**: `ptJobs`

## Resource & Capability Relationships

### 8. **ptCapabilities** (Skills/Abilities)
**Primary Key**: `external_id`
**Relationships**:
- **Many-to-Many**: `ptResources` (via `ptResourceCapabilities`)
- **Many-to-Many**: `ptJobResources` (via `ptJobResourceCapabilities`)

### 9. **ptResourceCapabilities** (Resource-Capability Junction)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`
- `capability_external_id` → `ptCapabilities.external_id`

### 10. **ptJobResourceCapabilities** (Job-Resource-Capability Junction)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `capability_external_id` → `ptCapabilities.external_id`

### 11. **ptJobResources** (Resource Assignments)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `operation_external_id` → `ptJobOperations.external_id`
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

## Material & Inventory Relationships

### 12. **ptItems** (Product/Material Master)
**Primary Key**: `external_id`
**Relationships**:
- **Parent to**: `ptJobs`, `ptJobMaterials`, `ptJobProducts`, `ptInventories`, `ptLots`, `ptForecasts`
- **Related to**: `ptSalesOrderLines`, `ptTransferOrderDistributions`

### 13. **ptInventories** (Stock Levels)
**Foreign Keys**:
- `item_external_id` → `ptItems.external_id`
- `warehouse_external_id` → `ptWarehouses.external_id`

### 14. **ptLots** (Batch/Lot Tracking)
**Foreign Keys**:
- `item_external_id` → `ptItems.external_id`
- `warehouse_external_id` → `ptWarehouses.external_id`

### 15. **ptWarehouses** (Storage Locations)
**Primary Key**: `external_id`
**Relationships**:
- **Parent to**: `ptInventories`, `ptLots`, `ptPlantWarehouses`
- **Related to**: `ptForecastShipments`, `ptSalesOrderLineDistributions`, `ptTransferOrderDistributions`

### 16. **ptPlantWarehouses** (Plant-Warehouse Associations)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `warehouse_external_id` → `ptWarehouses.external_id`

## Job Material & Product Relationships

### 17. **ptJobMaterials** (Material Requirements)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `operation_external_id` → `ptJobOperations.external_id`
- `path_external_id` → `ptJobPaths.external_id`
- `item_external_id` → `ptItems.external_id`

### 18. **ptJobProducts** (Production Outputs)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `operation_external_id` → `ptJobOperations.external_id`
- `path_external_id` → `ptJobPaths.external_id`
- `item_external_id` → `ptItems.external_id`

### 19. **ptJobActivities** (Job Activities)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `operation_external_id` → `ptJobOperations.external_id`

### 20. **ptJobPathNodes** (Path Node Definitions)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `path_external_id` → `ptJobPaths.external_id`

## Sales & Customer Relationships

### 21. **ptCustomers** (Customer Master)
**Primary Key**: `external_id`
**Relationships**:
- **Parent to**: `ptSalesOrders`, `ptCustomerConnections`

### 22. **ptSalesOrders** (Sales Order Header)
**Primary Key**: `external_id`
**Foreign Keys**: `customer_external_id` → `ptCustomers.external_id`
**Relationships**:
- **Parent to**: `ptSalesOrderLines`, `ptSalesOrderLineDistributions`

### 23. **ptSalesOrderLines** (Sales Order Line Items)
**Foreign Keys**:
- `sales_order_external_id` → `ptSalesOrders.external_id`
- `item_external_id` → `ptItems.external_id`
**Relationships**:
- **Parent to**: `ptSalesOrderLineDistributions`

### 24. **ptSalesOrderLineDistributions** (Delivery Details)
**Foreign Keys**:
- `sales_order_external_id` → `ptSalesOrders.external_id`
- `must_supply_from_warehouse_external_id` → `ptWarehouses.external_id`

## Forecasting Relationships

### 25. **ptForecasts** (Demand Forecasts)
**Foreign Keys**: `item_external_id` → `ptItems.external_id`
**Relationships**:
- **Related to**: `ptForecastShipments`

### 26. **ptForecastShipments** (Forecast Shipment Details)
**Foreign Keys**:
- `forecast_external_id` → `ptForecasts.external_id`
- `warehouse_external_id` → `ptWarehouses.external_id`

## Transfer & Purchasing Relationships

### 27. **ptTransferOrders** (Inter-location Transfers)
**Primary Key**: `external_id`
**Relationships**:
- **Parent to**: `ptTransferOrderDistributions`

### 28. **ptTransferOrderDistributions** (Transfer Details)
**Foreign Keys**:
- `transfer_order_external_id` → `ptTransferOrders.external_id`
- `item_external_id` → `ptItems.external_id`
- `from_warehouse_external_id` → `ptWarehouses.external_id`
- `to_warehouse_external_id` → `ptWarehouses.external_id`

### 29. **ptPurchasesToStock** (Purchase Orders)
**Foreign Keys**: `item_external_id` → `ptItems.external_id`

## Setup & Optimization Relationships

### 30. **ptAttributes** (Setup Attributes)
**Primary Key**: `external_id`
**Relationships**:
- **Related to**: All attribute tables (`ptAttributeCodeTables`, `ptAttributeRangeTables`)
- **Used in**: `ptJobOperationAttributes`

### 31. **ptAttributeCodeTables** (Setup Code Tables)
**Relationships**:
- **Parent to**: `ptAttributeCodeTableAttrCodes`, `ptAttributeCodeTableAttrNames`, `ptAttributeCodeTableResources`

### 32. **ptAttributeCodeTableAttrCodes** (Attribute Codes)
**Foreign Keys**: `attribute_external_id` → `ptAttributes.external_id`

### 33. **ptAttributeCodeTableAttrNames** (Attribute Names)
**Foreign Keys**: `attribute_external_id` → `ptAttributes.external_id`

### 34. **ptAttributeCodeTableResources** (Code Table Resources)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

### 35. **ptAttributeRangeTables** (Range Tables)
**Relationships**:
- **Parent to**: `ptAttributeRangeTableAttrNames`, `ptAttributeRangeTableFrom`, `ptAttributeRangeTableTo`, `ptAttributeRangeTableResources`

### 36. **ptAttributeRangeTableAttrNames** (Range Attribute Names)
**Foreign Keys**: `attribute_external_id` → `ptAttributes.external_id`

### 37. **ptAttributeRangeTableFrom** (Range From Values)
**Foreign Keys**: `attribute_external_id` → `ptAttributes.external_id`

### 38. **ptAttributeRangeTableTo** (Range To Values)
**Foreign Keys**: `attribute_external_id` → `ptAttributes.external_id`

### 39. **ptAttributeRangeTableResources** (Range Table Resources)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

### 40. **ptJobOperationAttributes** (Operation Attributes)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `operation_external_id` → `ptJobOperations.external_id`
- `attribute_external_id` → `ptAttributes.external_id`

## Capacity & Scheduling Relationships

### 41. **ptCapacityIntervals** (Capacity Definitions)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`
**Relationships**:
- **Related to**: `ptCapacityIntervalResources`

### 42. **ptCapacityIntervalResources** (Capacity Resource Links)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

### 43. **ptRecurringCapacityIntervals** (Recurring Capacity)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

## Cell & Layout Relationships

### 44. **ptCells** (Manufacturing Cells)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`

## Cleanout & Maintenance Relationships

### 45. **ptCleanoutTriggerTables** (Cleanout Rules)
**Relationships**:
- **Parent to**: `ptCleanoutTriggerTableOpCount`, `ptCleanoutTriggerTableProdUnits`, `ptCleanoutTriggerTableTime`, `ptCleanoutTriggerTableResources`

### 46. **ptCleanoutTriggerTableOpCount** (Operation Count Triggers)
**Foreign Keys**: References cleanout trigger tables

### 47. **ptCleanoutTriggerTableProdUnits** (Production Unit Triggers)
**Foreign Keys**: References cleanout trigger tables

### 48. **ptCleanoutTriggerTableTime** (Time-based Triggers)
**Foreign Keys**: References cleanout trigger tables

### 49. **ptCleanoutTriggerTableResources** (Resource Cleanout Rules)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

## Compatibility Relationships

### 50. **ptCompatibilityCodes** (Compatibility Rules)
**Relationships**:
- **Related to**: `ptCompatibilityCodeTables`, `ptCompatibilityCodeTableResources`

### 51. **ptCompatibilityCodeTables** (Compatibility Tables)
**Relationships**:
- **Parent to**: `ptCompatibilityCodeTableResources`

### 52. **ptCompatibilityCodeTableResources** (Compatibility Resources)
**Foreign Keys**:
- `plant_external_id` → `ptPlants.external_id`
- `department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

## Connection & Network Relationships

### 53. **ptResourceConnections** (Resource Networks)
**Foreign Keys**:
- `from_plant_external_id` → `ptPlants.external_id`
- `from_department_external_id` → `ptDepartments.external_id`
- `from_resource_external_id` → `ptResources.external_id`
- `to_plant_external_id` → `ptPlants.external_id`
- `to_department_external_id` → `ptDepartments.external_id`
- `to_resource_external_id` → `ptResources.external_id`

### 54. **ptResourceConnectors** (Connection Details)
**Foreign Keys**: References resource connections

### 55. **ptCustomerConnections** (Customer Networks)
**Foreign Keys**: `customer_external_id` → `ptCustomers.external_id`

## Production Rules & Helper Relationships

### 56. **ptProductRules** (Production Rules)
**Foreign Keys**: `item_external_id` → `ptItems.external_id`

### 57. **ptAllowedHelpers** (Resource Helper Rules)
**Foreign Keys**:
- `allowed_helper_plant_external_id` → `ptPlants.external_id`
- `allowed_helper_department_external_id` → `ptDepartments.external_id`
- `allowed_helper_resource_external_id` → `ptResources.external_id`
- `resource_plant_external_id` → `ptPlants.external_id`
- `resource_department_external_id` → `ptDepartments.external_id`
- `resource_external_id` → `ptResources.external_id`

## Job Successor & Dependency Relationships

### 58. **ptJobSuccessorManufacturingOrders** (Job Dependencies)
**Foreign Keys**:
- `job_external_id` → `ptJobs.external_id`
- `mo_external_id` → `ptManufacturingOrders.external_id`
- `successor_job_external_id` → `ptJobs.external_id`
- `successor_manufacturing_order_external_id` → `ptManufacturingOrders.external_id`
- `successor_operation_external_id` → `ptJobOperations.external_id`

## User Management

### 59. **ptUsers** (PT System Users)
**Primary Key**: `external_id`
**Relationships**:
- **Standalone**: User management for PT system access

## Summary of Key Relationship Patterns

### Primary Hierarchies:
1. **Plant → Department → Resource** (Manufacturing Structure)
2. **Item → Job → Operation → Activity** (Production Flow) 
3. **Customer → Sales Order → Order Line → Distribution** (Order Management)
4. **Warehouse → Inventory/Lots** (Material Management)

### Many-to-Many Relationships:
- Resources ↔ Capabilities (via ptResourceCapabilities)
- Jobs ↔ Resource Capabilities (via ptJobResourceCapabilities)
- Attribute Tables ↔ Resources (via various resource tables)

### Cross-Reference Tables:
- Helper relationships between resources
- Capacity intervals across resources
- Cleanout triggers and compatibility rules
- Connection networks between resources

This comprehensive relationship structure enables full traceability and optimization across the entire manufacturing value chain, from customer orders through production planning, resource scheduling, material management, and delivery execution.