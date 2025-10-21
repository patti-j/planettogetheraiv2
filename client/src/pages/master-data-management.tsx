import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { EditableDataGrid } from '@/components/editable-data-grid';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { 
  Database, 
  Table, 
  Sparkles, 
  Upload, 
  Download, 
  RefreshCw, 
  Settings,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  Factory,
  Package,
  Users,
  Truck,
  ClipboardList,
  Wrench,
  GitBranch,
  Beaker,
  Warehouse,
  Archive,
  Building2,
  Clock,
  Calendar,
  PackageCheck,
  Shield,
  MapPin,
  UserCheck,
  ArchiveRestore,
  Grid3x3,
  LayoutGrid,
  List,
  Loader2,
  ShoppingCart,
  FileText
} from 'lucide-react';

// Master data table definitions with metadata
const masterDataTables = [
  {
    id: 'plants',
    name: 'Plants',
    description: 'Manufacturing facilities and locations',
    icon: Factory,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'location', header: 'Location', type: 'text' as const },
      { key: 'address', header: 'Address', type: 'text' as const },
      { key: 'timezone', header: 'Timezone', type: 'text' as const, required: true },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'resources',
    name: 'Resources',
    description: 'Equipment, machines, and production resources',
    icon: Wrench,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'type', header: 'Type', type: 'text' as const, required: true },
      { key: 'status', header: 'Status', type: 'select' as const, 
        options: [
          { value: 'active', label: 'Active' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      { key: 'capabilities', header: 'Capabilities', type: 'json' as const },
      { key: 'isDrum', header: 'Is Drum', type: 'boolean' as const },
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Production operations and tasks',
    icon: Settings,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'operationType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'setup', label: 'Setup' },
          { value: 'production', label: 'Production' },
          { value: 'teardown', label: 'Teardown' },
          { value: 'quality', label: 'Quality Check' }
        ]
      },
      { key: 'standardTime', header: 'Standard Time (min)', type: 'number' as const },
      { key: 'setupTime', header: 'Setup Time (min)', type: 'number' as const },
      { key: 'resourceRequired', header: 'Resource Required', type: 'text' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'workCenters',
    name: 'Work Centers',
    description: 'Production work centers and stations',
    icon: Layers,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'code', header: 'Code', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'departmentId', header: 'Department ID', type: 'number' as const },
      { key: 'plantId', header: 'Plant ID', type: 'number' as const },
      { key: 'capacity', header: 'Capacity', type: 'number' as const },
      { key: 'efficiency', header: 'Efficiency %', type: 'number' as const },
      { key: 'costPerHour', header: 'Cost/Hour ($)', type: 'number' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'storageLocations',
    name: 'Storage Locations',
    description: 'Warehouses and storage areas',
    icon: Warehouse,
    category: 'Inventory',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'code', header: 'Code', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'plantId', header: 'Plant ID', type: 'number' as const },
      { key: 'locationType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'general', label: 'General' },
          { value: 'finished_goods', label: 'Finished Goods' },
          { value: 'raw_materials', label: 'Raw Materials' },
          { value: 'work_in_process', label: 'Work in Process' }
        ]
      },
      { key: 'totalCapacity', header: 'Total Capacity', type: 'number' as const },
      { key: 'usedCapacity', header: 'Used Capacity', type: 'number' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'stocks',
    name: 'Stock Levels',
    description: 'Current inventory stock levels',
    icon: Archive,
    category: 'Inventory',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'itemId', header: 'Item ID', type: 'number' as const, required: true },
      { key: 'storageLocationId', header: 'Location ID', type: 'number' as const, required: true },
      { key: 'quantityOnHand', header: 'On Hand', type: 'number' as const },
      { key: 'quantityReserved', header: 'Reserved', type: 'number' as const },
      { key: 'quantityAvailable', header: 'Available', type: 'number' as const },
      { key: 'minimumLevel', header: 'Min Level', type: 'number' as const },
      { key: 'maximumLevel', header: 'Max Level', type: 'number' as const },
      { key: 'unitCost', header: 'Unit Cost ($)', type: 'number' as const },
      { key: 'status', header: 'Status', type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'blocked', label: 'Blocked' },
          { value: 'quarantine', label: 'Quarantine' }
        ]
      },
    ]
  },
  {
    id: 'ptDepartments',
    name: 'Departments (PT)',
    description: 'PT organizational departments',
    icon: Building2,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'departmentId', header: 'Department ID', type: 'number' as const, required: true },
      { key: 'plantId', header: 'Plant ID', type: 'number' as const, required: true },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'notes', header: 'Notes', type: 'text' as const },
      { key: 'externalId', header: 'External ID', type: 'text' as const },
      { key: 'plantName', header: 'Plant Name', type: 'text' as const },
    ]
  },
  {
    id: 'ptPurchasesToStock',
    name: 'Purchase Orders (PT)',
    description: 'PT purchase to stock orders',
    icon: ShoppingCart,
    category: 'Orders',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'purchaseToStockId', header: 'Purchase Order ID', type: 'number' as const, required: true },
      { key: 'supplierExternalId', header: 'Supplier ID', type: 'text' as const },
      { key: 'inventoryId', header: 'Inventory ID', type: 'number' as const },
      { key: 'purchaseOrderExternalId', header: 'PO External ID', type: 'text' as const },
      { key: 'orderQty', header: 'Order Quantity', type: 'number' as const },
      { key: 'orderDate', header: 'Order Date', type: 'date' as const },
      { key: 'expectedReceiptDate', header: 'Expected Receipt', type: 'date' as const },
    ]
  },
  {
    id: 'ptTransferOrders',
    name: 'Transfer Orders (PT)',
    description: 'PT transfer orders',
    icon: FileText,
    category: 'Orders',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'transferOrderId', header: 'Transfer Order ID', type: 'number' as const, required: true },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'notes', header: 'Notes', type: 'text' as const },
      { key: 'externalId', header: 'External ID', type: 'text' as const },
      { key: 'firm', header: 'Firm', type: 'boolean' as const },
      { key: 'priority', header: 'Priority', type: 'number' as const },
    ]
  },
  {
    id: 'shifts',
    name: 'Shifts',
    description: 'Work shift definitions',
    icon: Clock,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'startTime', header: 'Start Time', type: 'text' as const },
      { key: 'endTime', header: 'End Time', type: 'text' as const },
      { key: 'shiftType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'day', label: 'Day' },
          { value: 'evening', label: 'Evening' },
          { value: 'night', label: 'Night' },
          { value: 'rotating', label: 'Rotating' }
        ]
      },
      { key: 'plantId', header: 'Plant ID', type: 'number' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'holidays',
    name: 'Holidays',
    description: 'Company holiday calendar',
    icon: Calendar,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'date', header: 'Date', type: 'date' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'plantId', header: 'Plant ID', type: 'number' as const },
      { key: 'isRecurring', header: 'Recurring', type: 'boolean' as const },
      { key: 'isPaidHoliday', header: 'Paid Holiday', type: 'boolean' as const },
    ]
  },
  {
    id: 'stockItems',
    name: 'Stock Items',
    description: 'Stock item master data',
    icon: PackageCheck,
    category: 'Inventory',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'itemNumber', header: 'Item Number', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const, required: true },
      { key: 'unitOfMeasure', header: 'UOM', type: 'text' as const },
      { key: 'reorderPoint', header: 'Reorder Point', type: 'number' as const },
      { key: 'safetyStock', header: 'Safety Stock', type: 'number' as const },
      { key: 'economicOrderQuantity', header: 'EOQ', type: 'number' as const },
      { key: 'leadTime', header: 'Lead Time (days)', type: 'number' as const },
      { key: 'standardCost', header: 'Standard Cost ($)', type: 'number' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'productionVersions',
    name: 'Production Versions',
    description: 'Product manufacturing versions and variants',
    icon: GitBranch,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'versionCode', header: 'Version Code', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'itemNumber', header: 'Item Number', type: 'text' as const, required: true },
      { key: 'validFrom', header: 'Valid From', type: 'date' as const },
      { key: 'validTo', header: 'Valid To', type: 'date' as const },
      { key: 'recipeId', header: 'Recipe ID', type: 'number' as const },
      { key: 'routingId', header: 'Routing ID', type: 'number' as const },
      { key: 'billOfMaterialId', header: 'BOM ID', type: 'number' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
      { key: 'isDefault', header: 'Default', type: 'boolean' as const },
    ]
  },
  {
    id: 'capabilities',
    name: 'Capabilities',
    description: 'Resource and work center capabilities',
    icon: Wrench,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'type', header: 'Type', type: 'select' as const,
        options: [
          { value: 'skill', label: 'Skill' },
          { value: 'certification', label: 'Certification' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'process', label: 'Process' }
        ]
      },
      { key: 'level', header: 'Level', type: 'number' as const },
      { key: 'validFrom', header: 'Valid From', type: 'date' as const },
      { key: 'validTo', header: 'Valid To', type: 'date' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'constraints',
    name: 'Constraints',
    description: 'Production and scheduling constraints',
    icon: Shield,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'constraintType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'capacity', label: 'Capacity' },
          { value: 'material', label: 'Material' },
          { value: 'timing', label: 'Timing' },
          { value: 'sequence', label: 'Sequence' },
          { value: 'resource', label: 'Resource' }
        ]
      },
      { key: 'severity', header: 'Severity', type: 'select' as const,
        options: [
          { value: 'hard', label: 'Hard' },
          { value: 'soft', label: 'Soft' },
          { value: 'preference', label: 'Preference' }
        ]
      },
      { key: 'value', header: 'Value', type: 'text' as const },
      { key: 'entityType', header: 'Entity Type', type: 'text' as const },
      { key: 'entityId', header: 'Entity ID', type: 'number' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'employees',
    name: 'Employees',
    description: 'Employee master records',
    icon: UserCheck,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'employeeNumber', header: 'Employee #', type: 'text' as const, required: true },
      { key: 'firstName', header: 'First Name', type: 'text' as const, required: true },
      { key: 'lastName', header: 'Last Name', type: 'text' as const, required: true },
      { key: 'email', header: 'Email', type: 'text' as const },
      { key: 'phoneNumber', header: 'Phone', type: 'text' as const },
      { key: 'departmentId', header: 'Department ID', type: 'number' as const },
      { key: 'jobTitle', header: 'Job Title', type: 'text' as const },
      { key: 'hireDate', header: 'Hire Date', type: 'date' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'sites',
    name: 'Sites',
    description: 'Manufacturing sites and locations',
    icon: MapPin,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'code', header: 'Site Code', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'siteType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'manufacturing', label: 'Manufacturing' },
          { value: 'warehouse', label: 'Warehouse' },
          { value: 'distribution', label: 'Distribution' },
          { value: 'office', label: 'Office' }
        ]
      },
      { key: 'address', header: 'Address', type: 'text' as const },
      { key: 'city', header: 'City', type: 'text' as const },
      { key: 'state', header: 'State', type: 'text' as const },
      { key: 'country', header: 'Country', type: 'text' as const },
      { key: 'timeZone', header: 'Time Zone', type: 'text' as const },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'inventoryLots',
    name: 'Inventory Lots',
    description: 'Batch and lot tracking',
    icon: ArchiveRestore,
    category: 'Inventory',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'lotNumber', header: 'Lot Number', type: 'text' as const, required: true },
      { key: 'itemId', header: 'Item ID', type: 'number' as const, required: true },
      { key: 'storageLocationId', header: 'Location ID', type: 'number' as const },
      { key: 'quantity', header: 'Quantity', type: 'number' as const },
      { key: 'manufactureDate', header: 'Manufacture Date', type: 'date' as const },
      { key: 'expirationDate', header: 'Expiration Date', type: 'date' as const },
      { key: 'status', header: 'Status', type: 'select' as const,
        options: [
          { value: 'available', label: 'Available' },
          { value: 'reserved', label: 'Reserved' },
          { value: 'consumed', label: 'Consumed' },
          { value: 'expired', label: 'Expired' },
          { value: 'quarantine', label: 'Quarantine' }
        ]
      },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'items',
    name: 'Items',
    description: 'Products, materials, and inventory items',
    icon: Package,
    category: 'Inventory',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'itemNumber', header: 'Item Number', type: 'text' as const, required: true },
      { key: 'itemName', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'itemType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'finished_good', label: 'Finished Good' },
          { value: 'raw_material', label: 'Raw Material' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'consumable', label: 'Consumable' }
        ]
      },
      { key: 'unitOfMeasure', header: 'UOM', type: 'text' as const },
      { key: 'standardCost', header: 'Std Cost', type: 'number' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
    ]
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'Customer accounts and information',
    icon: Users,
    category: 'Business',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'customerNumber', header: 'Customer #', type: 'text' as const, required: true },
      { key: 'customerName', header: 'Name', type: 'text' as const, required: true },
      { key: 'customerType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'preferred', label: 'Preferred' },
          { value: 'key_account', label: 'Key Account' },
          { value: 'distributor', label: 'Distributor' }
        ]
      },
      { key: 'contactEmail', header: 'Email', type: 'text' as const },
      { key: 'contactPhone', header: 'Phone', type: 'text' as const },
      { key: 'creditLimit', header: 'Credit Limit', type: 'number' as const },
      { key: 'accountStatus', header: 'Status', type: 'text' as const },
    ]
  },
  {
    id: 'vendors',
    name: 'Vendors',
    description: 'Suppliers and vendor information',
    icon: Truck,
    category: 'Business',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'vendorNumber', header: 'Vendor #', type: 'text' as const, required: true },
      { key: 'vendorName', header: 'Name', type: 'text' as const, required: true },
      { key: 'vendorType', header: 'Type', type: 'text' as const },
      { key: 'contactEmail', header: 'Email', type: 'text' as const },
      { key: 'contactPhone', header: 'Phone', type: 'text' as const },
      { key: 'paymentTerms', header: 'Payment Terms', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
    ]
  },
  {
    id: 'billsOfMaterial',
    name: 'Bills of Material',
    description: 'Product structure and component lists',
    icon: ClipboardList,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'bomNumber', header: 'BOM Number', type: 'text' as const, required: true },
      { key: 'productItemNumber', header: 'Product', type: 'text' as const, required: true },
      { key: 'version', header: 'Version', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'effectiveDate', header: 'Effective Date', type: 'date' as const },
      { key: 'endDate', header: 'End Date', type: 'date' as const },
    ]
  },
  {
    id: 'routings',
    name: 'Routings',
    description: 'Manufacturing process sequences',
    icon: GitBranch,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'routingNumber', header: 'Routing #', type: 'text' as const, required: true },
      { key: 'productItemNumber', header: 'Product', type: 'text' as const, required: true },
      { key: 'version', header: 'Version', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'totalCycleTime', header: 'Cycle Time', type: 'number' as const },
    ]
  },
  {
    id: 'recipes',
    name: 'Recipes',
    description: 'Process manufacturing formulas',
    icon: Beaker,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'recipeNumber', header: 'Recipe #', type: 'text' as const, required: true },
      { key: 'recipeName', header: 'Name', type: 'text' as const, required: true },
      { key: 'productItemNumber', header: 'Product', type: 'text' as const, required: true },
      { key: 'recipeVersion', header: 'Version', type: 'text' as const },
      { key: 'recipeType', header: 'Type', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'batchSize', header: 'Batch Size', type: 'number' as const },
    ]
  },
  {
    id: 'pt-jobs',
    name: 'Jobs (Production Orders)',
    description: 'Production jobs and manufacturing orders',
    icon: ClipboardList,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'jobNumber', header: 'Job Number', type: 'text' as const, required: true },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'select' as const,
        options: [
          { value: 'planned', label: 'Planned' },
          { value: 'released', label: 'Released' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      { key: 'priority', header: 'Priority', type: 'number' as const },
      { key: 'plannedStartDate', header: 'Planned Start', type: 'date' as const },
      { key: 'plannedEndDate', header: 'Planned End', type: 'date' as const },
      { key: 'actualStartDate', header: 'Actual Start', type: 'date' as const },
      { key: 'actualEndDate', header: 'Actual End', type: 'date' as const },
      { key: 'qty', header: 'Quantity', type: 'number' as const },
      { key: 'unitOfMeasure', header: 'UOM', type: 'text' as const },
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Manufacturing operations and work steps',
    icon: GitBranch,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Operation Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'jobId', header: 'Job ID', type: 'number' as const, required: true },
      { key: 'productionOrderId', header: 'Production Order ID', type: 'number' as const },
      { key: 'order', header: 'Sequence', type: 'number' as const },
      { key: 'status', header: 'Status', type: 'select' as const,
        options: [
          { value: 'planned', label: 'Planned' },
          { value: 'ready', label: 'Ready' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'delayed', label: 'Delayed' },
          { value: 'on_hold', label: 'On Hold' }
        ]
      },
      { key: 'assignedResourceId', header: 'Assigned Resource', type: 'number' as const },
      { key: 'workCenterId', header: 'Work Center ID', type: 'number' as const },
      { key: 'standardDuration', header: 'Standard Duration (hrs)', type: 'number' as const },
      { key: 'actualDuration', header: 'Actual Duration (hrs)', type: 'number' as const },
      { key: 'startTime', header: 'Start Time', type: 'date' as const },
      { key: 'endTime', header: 'End Time', type: 'date' as const },
      { key: 'completionPercentage', header: 'Completion %', type: 'number' as const },
    ]
  },
  {
    id: 'pt-departments',
    name: 'Departments',
    description: 'Manufacturing departments and work areas',
    icon: Building2,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'plant_id', header: 'Plant ID', type: 'number' as const, required: true },
      { key: 'department_id', header: 'Department ID', type: 'number' as const, required: true },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'notes', header: 'Notes', type: 'text' as const },
      { key: 'external_id', header: 'External ID', type: 'text' as const },
      { key: 'plant_name', header: 'Plant Name', type: 'text' as const },
      { key: 'resource_count', header: 'Resource Count', type: 'number' as const },
      { key: 'department_frozen_span_days', header: 'Frozen Span Days', type: 'number' as const },
      { key: 'work_center_id', header: 'Work Center ID', type: 'number' as const },
    ]
  },
  {
    id: 'pt-product-rules',
    name: 'Product Rules',
    description: 'Production rules for items, setup times, and speeds',
    icon: Settings,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'item_id', header: 'Item ID', type: 'number' as const, required: true },
      { key: 'plant_id', header: 'Plant ID', type: 'number' as const, required: true },
      { key: 'department_id', header: 'Department ID', type: 'number' as const, required: true },
      { key: 'resource_id', header: 'Resource ID', type: 'number' as const, required: true },
      { key: 'operation_code', header: 'Operation Code', type: 'text' as const, required: true },
      { key: 'setup_hrs', header: 'Setup Hours', type: 'number' as const },
      { key: 'use_setup_hrs', header: 'Use Setup Hours', type: 'boolean' as const },
      { key: 'setup_scrap_qty', header: 'Setup Scrap Qty', type: 'number' as const },
      { key: 'setup_scrap_percent', header: 'Setup Scrap %', type: 'number' as const },
      { key: 'use_setup_scrap_qty', header: 'Use Setup Scrap Qty', type: 'boolean' as const },
      { key: 'use_setup_scrap_percent', header: 'Use Setup Scrap %', type: 'boolean' as const },
      { key: 'run_speed', header: 'Run Speed', type: 'number' as const },
      { key: 'use_run_speed', header: 'Use Run Speed', type: 'boolean' as const },
      { key: 'run_scrap_percent', header: 'Run Scrap %', type: 'number' as const },
      { key: 'use_run_scrap_percent', header: 'Use Run Scrap %', type: 'boolean' as const },
      { key: 'is_preferred_equipment', header: 'Preferred Equipment', type: 'boolean' as const },
    ]
  },
  {
    id: 'pt-connected-resources',
    name: 'Connected Resources',
    description: 'Resource assignments and connections to jobs',
    icon: Settings,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'job_id', header: 'Job ID', type: 'number' as const, required: true },
      { key: 'manufacturing_order_id', header: 'Manufacturing Order ID', type: 'number' as const },
      { key: 'operation_id', header: 'Operation ID', type: 'number' as const, required: true },
      { key: 'resource_requirement_id', header: 'Resource Requirement ID', type: 'number' as const },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'external_id', header: 'External ID', type: 'text' as const },
      { key: 'usage_start', header: 'Usage Start', type: 'text' as const },
      { key: 'usage_end', header: 'Usage End', type: 'text' as const },
      { key: 'attention_percent', header: 'Attention %', type: 'number' as const },
      { key: 'is_primary', header: 'Primary Resource', type: 'boolean' as const },
      { key: 'default_resource_jit_limit_hrs', header: 'JIT Limit Hours', type: 'number' as const },
      { key: 'use_default_resource_jit_limit', header: 'Use JIT Limit', type: 'boolean' as const },
      { key: 'default_resource_id', header: 'Default Resource ID', type: 'number' as const },
      { key: 'capacity_code', header: 'Capacity Code', type: 'text' as const },
    ]
  }
];

type ViewMode = 'spreadsheet' | 'card' | 'compressed';

export default function MasterDataManagement() {
  const [selectedTable, setSelectedTable] = useState('resources');
  const [viewMode, setViewMode] = useState<ViewMode>('spreadsheet');
  const { toast } = useToast();
  const { user } = useAuth();
  const { addRecentPage } = useNavigation();
  const { setMaxOpen, setCanvasItems } = useMaxDock();

  // Register this page in recent pages when component mounts
  useEffect(() => {
    addRecentPage('/master-data', 'Master Data Management', 'Database');
  }, []);

  // Get the current table configuration
  const currentTableConfig = masterDataTables.find(t => t.id === selectedTable);

  // Fetch data for the selected table
  const { data: tableData = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/${selectedTable === 'stockItems' ? 'stock-items' : selectedTable}`],
    enabled: !!selectedTable,
  });

  // Mutation for saving data changes
  const saveMutation = useMutation({
    mutationFn: async (updatedData: any[]) => {
      return await apiRequest('PUT', `/api/master-data/${selectedTable}`, { data: updatedData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedTable === 'stockItems' ? 'stock-items' : selectedTable}`] });
      toast({
        title: "Success",
        description: "Data saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive"
      });
    }
  });

  // Mutation for individual row updates
  const updateRowMutation = useMutation({
    mutationFn: async ({ index, row }: { index: number; row: any }) => {
      return await apiRequest('PATCH', `/api/master-data/${selectedTable}/${row.id}`, row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedTable === 'stockItems' ? 'stock-items' : selectedTable}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update row",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting rows
  const deleteRowMutation = useMutation({
    mutationFn: async (rowId: number) => {
      return await apiRequest('DELETE', `/api/master-data/${selectedTable}/${rowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedTable === 'stockItems' ? 'stock-items' : selectedTable}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive"
      });
    }
  });

  // Mutation for adding new rows
  const addRowMutation = useMutation({
    mutationFn: async (newRow: any) => {
      return await apiRequest('POST', `/api/master-data/${selectedTable}`, newRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedTable === 'stockItems' ? 'stock-items' : selectedTable}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add row",
        variant: "destructive"
      });
    }
  });

  // Open Max panel with context for AI-powered data modification
  const openMaxForDataEdit = () => {
    // Open the Max panel
    setMaxOpen(true);
    
    // Set canvas items with table context
    const tableContext = {
      id: `table-context-${Date.now()}`,
      type: 'custom' as const,
      title: `Editing ${currentTableConfig?.name || 'Master Data'}`,
      content: {
        message: `You're now editing the "${currentTableConfig?.name}" table with ${tableData.length} records.
        
Ask me to:
• Bulk update fields based on conditions
• Generate sample data for testing  
• Clean and standardize data formats
• Apply business rules and validations
• Create relationships between data
• Export or transform the data`,
        tableInfo: {
          name: currentTableConfig?.name,
          description: currentTableConfig?.description,
          recordCount: tableData.length,
          columns: currentTableConfig?.columns.map(col => col.header)
        }
      }
    };
    
    setCanvasItems([tableContext]);
  };

  // Mutation for populating data from PT tables
  const populateFromPTMutation = useMutation<{message: string}>({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/master-data/populate-from-pt`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/master-data`] });
      refetch(); // Refresh current table data
      toast({
        title: "Success",
        description: data?.message || "Successfully populated data from PT tables",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to populate data from PT tables",
        variant: "destructive"
      });
    }
  });

  // Export data as CSV
  const exportData = () => {
    if (!tableData || tableData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const headers = currentTableConfig?.columns.map(c => c.header).join(',');
    const rows = tableData.map(row => 
      currentTableConfig?.columns.map(c => {
        const value = row[c.key];
        if (typeof value === 'object') return JSON.stringify(value);
        return value ?? '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render card view component
  const renderCardView = () => {
    if (!currentTableConfig) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {tableData.map((item: any, index: number) => (
          <Card key={item.id || index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {item.name || item.itemNumber || item.vendorName || item.customerName || `Item ${index + 1}`}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const updatedItem = { ...item, isActive: !item.isActive };
                      updateRowMutation.mutate({ index, row: updatedItem });
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteRowMutation.mutate(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentTableConfig.columns
                .filter((col) => col.key !== 'id' && col.key !== 'name')
                .slice(0, 5)
                .map((col) => (
                  <div key={col.key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{col.header}:</span>
                    <span className="font-medium text-right">
                      {item[col.key] || '-'}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-muted/50" onClick={() => addRowMutation.mutate({})}>
          <div className="text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add New Item</p>
          </div>
        </Card>
      </div>
    );
  };

  // Render compressed card view component
  const renderCompressedView = () => {
    if (!currentTableConfig) return null;
    
    return (
      <div className="space-y-2 p-4">
        {tableData.map((item: any, index: number) => (
          <Card key={item.id || index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">ID:</span>
                    <p className="font-medium text-sm">{item.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {currentTableConfig.columns[1]?.header || 'Name'}:
                    </span>
                    <p className="font-medium text-sm">
                      {item[currentTableConfig.columns[1]?.key] || '-'}
                    </p>
                  </div>
                  {currentTableConfig.columns[2] && (
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {currentTableConfig.columns[2].header}:
                      </span>
                      <p className="font-medium text-sm">
                        {item[currentTableConfig.columns[2].key] || '-'}
                      </p>
                    </div>
                  )}
                  {currentTableConfig.columns[3] && (
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {currentTableConfig.columns[3].header}:
                      </span>
                      <p className="font-medium text-sm">
                        {item[currentTableConfig.columns[3].key] || '-'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const updatedItem = { ...item, isActive: !item.isActive };
                      updateRowMutation.mutate({ index, row: updatedItem });
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteRowMutation.mutate(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed cursor-pointer hover:bg-muted/50" onClick={() => addRowMutation.mutate({})}>
          <CardContent className="p-3 text-center">
            <p className="text-sm text-muted-foreground">+ Add New Item</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Group tables by category
  const tablesByCategory = masterDataTables.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, typeof masterDataTables>);

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="hidden sm:inline">Master Data Management</span>
          <span className="sm:hidden">Master Data</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          <span className="hidden sm:inline">Manage all master data tables with AI-powered editing and spreadsheet-like interface</span>
          <span className="sm:hidden">Manage and edit master data</span>
        </p>
      </div>

      {/* Mobile Table Selector - Dropdown on small screens */}
      <div className="block lg:hidden mb-4">
        <Select value={selectedTable} onValueChange={setSelectedTable}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a table" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(tablesByCategory).map(([category, tables]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">{category}</div>
                {tables.map(table => {
                  const Icon = table.icon;
                  return (
                    <SelectItem key={table.id} value={table.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{table.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Desktop Table Selector Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Data Tables</CardTitle>
              <CardDescription>Select a table to view and edit</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-4 pr-2">
                {Object.entries(tablesByCategory).map(([category, tables]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{category}</h3>
                    <div className="space-y-1">
                      {tables.map(table => {
                        const Icon = table.icon;
                        return (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTable(table.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              selectedTable === table.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{table.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    {currentTableConfig && (
                      <>
                        {React.createElement(currentTableConfig.icon, { className: "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" })}
                        <span className="truncate">{currentTableConfig.name}</span>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {currentTableConfig?.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  {/* View Mode Switcher */}
                  <div className="flex rounded-lg border divide-x">
                    <Button
                      variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('spreadsheet')}
                      className="rounded-r-none px-2 sm:px-3"
                      title="Spreadsheet View"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                      className="rounded-none px-2 sm:px-3"
                      title="Card View"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'compressed' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('compressed')}
                      className="rounded-l-none px-2 sm:px-3"
                      title="Compressed View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="px-2 sm:px-3"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline ml-1">Refresh</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportData}
                    className="px-2 sm:px-3"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Export</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => populateFromPTMutation.mutate()}
                    disabled={populateFromPTMutation.isPending}
                    className="px-2 sm:px-3"
                  >
                    <Upload className={`h-4 w-4 ${populateFromPTMutation.isPending ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline ml-1">Populate from PT</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={openMaxForDataEdit}
                    className="px-2 sm:px-3"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">AI Edit</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : currentTableConfig ? (
                viewMode === 'spreadsheet' ? (
                  <div className="overflow-x-auto">
                    <EditableDataGrid
                      columns={currentTableConfig.columns}
                      data={tableData as any[]}
                      onSave={async (data) => {
                        await saveMutation.mutateAsync(data);
                      }}
                      onRowUpdate={async (index, row) => {
                        await updateRowMutation.mutateAsync({ index, row });
                      }}
                      onRowDelete={async (index) => {
                        const row = tableData[index];
                        if (row?.id) await deleteRowMutation.mutateAsync(row.id);
                      }}
                      onRowAdd={async (row) => {
                        await addRowMutation.mutateAsync(row);
                      }}
                      allowAdd={true}
                      allowDelete={true}
                      allowBulkEdit={true}
                      gridHeight="calc(100vh - 300px)"
                    />
                  </div>
                ) : viewMode === 'card' ? (
                  renderCardView()
                ) : (
                  renderCompressedView()
                )
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Table className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">Select a table to view and edit data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}