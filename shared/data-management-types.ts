// High-performance data management types for large datasets

export interface PaginationRequest {
  page: number;
  limit: number;
  offset?: number;
}

export interface SearchRequest {
  query?: string;
  fields?: string[]; // Fields to search in
}

export interface FilterRequest {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in';
  value: any;
}

export interface SortRequest {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataRequest {
  pagination: PaginationRequest;
  search?: SearchRequest;
  filters?: FilterRequest[];
  sort?: SortRequest[];
}

export interface DataResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    queryTime: number;
    cacheHit?: boolean;
  };
}

export interface BulkUpdateRequest<T> {
  updates: Array<{
    id: number | string;
    data: Partial<T>;
  }>;
}

export interface BulkDeleteRequest {
  ids: (number | string)[];
}

export interface DataTypeConfig {
  key: string;
  name: string;
  table: string;
  primaryKey: string;
  searchableFields: string[];
  filterableFields: Array<{
    field: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    options?: Array<{ label: string; value: any }>;
  }>;
  editableFields: Array<{
    field: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';
    required?: boolean;
    options?: Array<{ label: string; value: any }>;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
  }>;
  displayFields: Array<{
    field: string;
    label: string;
    width?: number;
    sortable?: boolean;
    format?: 'date' | 'datetime' | 'currency' | 'percentage' | 'number';
  }>;
}

// Data type configurations for different master data types
export const DATA_TYPE_CONFIGS: Record<string, DataTypeConfig> = {
  plants: {
    key: 'plants',
    name: 'Plants',
    table: 'plants',
    primaryKey: 'id',
    searchableFields: ['name', 'location', 'address'],
    filterableFields: [
      { field: 'isActive', type: 'boolean' },
      { field: 'timezone', type: 'select', options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'EST', value: 'America/New_York' },
        { label: 'CST', value: 'America/Chicago' },
        { label: 'PST', value: 'America/Los_Angeles' },
      ]}
    ],
    editableFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'location', type: 'text' },
      { field: 'address', type: 'textarea' },
      { field: 'timezone', type: 'select', required: true, options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'EST', value: 'America/New_York' },
        { label: 'CST', value: 'America/Chicago' },
        { label: 'PST', value: 'America/Los_Angeles' },
      ]},
      { field: 'isActive', type: 'boolean' }
    ],
    displayFields: [
      { field: 'id', label: 'ID', width: 80, sortable: true },
      { field: 'name', label: 'Name', width: 200, sortable: true },
      { field: 'location', label: 'Location', width: 150, sortable: true },
      { field: 'timezone', label: 'Timezone', width: 120, sortable: true },
      { field: 'isActive', label: 'Active', width: 100, sortable: true },
      { field: 'createdAt', label: 'Created', width: 150, sortable: true, format: 'datetime' }
    ]
  },
  resources: {
    key: 'resources',
    name: 'Resources',
    table: 'resources',
    primaryKey: 'id',
    searchableFields: ['name', 'type'],
    filterableFields: [
      { field: 'type', type: 'select', options: [
        { label: 'Equipment', value: 'Equipment' },
        { label: 'Operator', value: 'Operator' },
        { label: 'Tool', value: 'Tool' },
        { label: 'Workstation', value: 'Workstation' }
      ]},
      { field: 'status', type: 'select', options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Maintenance', value: 'maintenance' }
      ]},
      { field: 'isShared', type: 'boolean' }
    ],
    editableFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'type', type: 'select', required: true, options: [
        { label: 'Equipment', value: 'Equipment' },
        { label: 'Operator', value: 'Operator' },
        { label: 'Tool', value: 'Tool' },
        { label: 'Workstation', value: 'Workstation' }
      ]},
      { field: 'status', type: 'select', required: true, options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Maintenance', value: 'maintenance' }
      ]},
      { field: 'isShared', type: 'boolean' }
    ],
    displayFields: [
      { field: 'id', label: 'ID', width: 80, sortable: true },
      { field: 'name', label: 'Name', width: 200, sortable: true },
      { field: 'type', label: 'Type', width: 120, sortable: true },
      { field: 'status', label: 'Status', width: 100, sortable: true },
      { field: 'isShared', label: 'Shared', width: 100, sortable: true },
      { field: 'plantId', label: 'Plant ID', width: 100, sortable: true }
    ]
  },
  capabilities: {
    key: 'capabilities',
    name: 'Capabilities',
    table: 'capabilities',
    primaryKey: 'id',
    searchableFields: ['name', 'description'],
    filterableFields: [],
    editableFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'description', type: 'textarea' }
    ],
    displayFields: [
      { field: 'id', label: 'ID', width: 80, sortable: true },
      { field: 'name', label: 'Name', width: 200, sortable: true },
      { field: 'description', label: 'Description', width: 300, sortable: true }
    ]
  },
  productionOrders: {
    key: 'productionOrders',
    name: 'Production Orders',
    table: 'production_orders',
    primaryKey: 'id',
    searchableFields: ['orderNumber', 'name', 'customer', 'itemNumber'],
    filterableFields: [
      { field: 'priority', type: 'select', options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ]},
      { field: 'status', type: 'select', options: [
        { label: 'Released', value: 'released' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ]},
      { field: 'plantId', type: 'number' }
    ],
    editableFields: [
      { field: 'orderNumber', type: 'text', required: true },
      { field: 'name', type: 'text', required: true },
      { field: 'description', type: 'textarea' },
      { field: 'customer', type: 'text', required: true },
      { field: 'priority', type: 'select', required: true, options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ]},
      { field: 'status', type: 'select', required: true, options: [
        { label: 'Released', value: 'released' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ]},
      { field: 'quantity', type: 'number', required: true, validation: { min: 1 }},
      { field: 'itemNumber', type: 'text' },
      { field: 'salesOrderNumber', type: 'text' }
    ],
    displayFields: [
      { field: 'id', label: 'ID', width: 80, sortable: true },
      { field: 'orderNumber', label: 'Order #', width: 150, sortable: true },
      { field: 'name', label: 'Name', width: 200, sortable: true },
      { field: 'customer', label: 'Customer', width: 150, sortable: true },
      { field: 'priority', label: 'Priority', width: 100, sortable: true },
      { field: 'status', label: 'Status', width: 120, sortable: true },
      { field: 'quantity', label: 'Qty', width: 80, sortable: true, format: 'number' },
      { field: 'dueDate', label: 'Due Date', width: 150, sortable: true, format: 'date' },
      { field: 'createdAt', label: 'Created', width: 150, sortable: true, format: 'datetime' }
    ]
  }
};