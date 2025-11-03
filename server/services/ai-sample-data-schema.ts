import { z } from 'zod';

/**
 * Zod schema for AI-generated sample data response
 * Used with OpenAI's structured outputs for reliable data generation
 */

// Individual data type schemas
const PlantDataSchema = z.object({
  name: z.string().describe('Plant name or facility name'),
  location: z.string().optional().describe('City, State or geographic location'),
  address: z.string().describe('Full physical address'),
  timezone: z.string().describe('Timezone identifier (e.g., America/New_York)'),
});

const CapabilityDataSchema = z.object({
  name: z.string().describe('Capability name or skill name'),
  description: z.string().describe('What this capability does'),
  category: z.string().describe('Category such as manufacturing, assembly, testing, etc.'),
});

const ResourceDataSchema = z.object({
  name: z.string().describe('Resource name or equipment name'),
  type: z.string().describe('Resource type such as Equipment, Labor, Machine, etc.'),
  description: z.string().describe('Resource description'),
  status: z.string().describe('Resource status: active, inactive, maintenance'),
});

const ProductionOrderDataSchema = z.object({
  orderNumber: z.string().describe('Unique order number (e.g., PO-001)'),
  name: z.string().describe('Order name or product name'),
  customer: z.string().describe('Customer name'),
  priority: z.string().describe('Priority: high, medium, low'),
  status: z.string().describe('Status: released, planned, in-progress, completed'),
  quantity: z.number().describe('Order quantity'),
  dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
  description: z.string().describe('Order description'),
});

const OperationDataSchema = z.object({
  name: z.string().describe('Operation name'),
  description: z.string().describe('Operation description'),
  duration: z.number().describe('Operation duration in hours'),
  requiredCapabilities: z.array(z.string()).describe('List of required capability names'),
});

// Main data types container
const DataTypesSchema = z.object({
  plants: z.array(PlantDataSchema).optional(),
  capabilities: z.array(CapabilityDataSchema).optional(),
  resources: z.array(ResourceDataSchema).optional(),
  productionOrders: z.array(ProductionOrderDataSchema).optional(),
  operations: z.array(OperationDataSchema).optional(),
});

// Complete AI response schema
export const AISampleDataResponseSchema = z.object({
  summary: z.string().describe('Brief description of what was generated'),
  dataTypes: DataTypesSchema.describe('Generated data organized by type'),
  totalRecords: z.number().describe('Total number of records generated across all types'),
  recommendations: z.array(z.string()).describe('List of recommendations for using this data'),
});

// TypeScript type inferred from schema
export type AISampleDataResponse = z.infer<typeof AISampleDataResponseSchema>;

// JSON Schema for OpenAI structured outputs
export const AISampleDataJSONSchema = {
  name: 'sample_data_generation',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Brief description of what was generated',
      },
      dataTypes: {
        type: 'object',
        properties: {
          plants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Plant name or facility name' },
                location: { type: 'string', description: 'City, State or geographic location' },
                address: { type: 'string', description: 'Full physical address' },
                timezone: { type: 'string', description: 'Timezone identifier (e.g., America/New_York)' },
              },
              required: ['name', 'address', 'timezone'],
              additionalProperties: false,
            },
          },
          capabilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Capability name or skill name' },
                description: { type: 'string', description: 'What this capability does' },
                category: { type: 'string', description: 'Category such as manufacturing, assembly, testing, etc.' },
              },
              required: ['name', 'description', 'category'],
              additionalProperties: false,
            },
          },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Resource name or equipment name' },
                type: { type: 'string', description: 'Resource type such as Equipment, Labor, Machine, etc.' },
                description: { type: 'string', description: 'Resource description' },
                status: { type: 'string', description: 'Resource status: active, inactive, maintenance' },
              },
              required: ['name', 'type', 'description', 'status'],
              additionalProperties: false,
            },
          },
          productionOrders: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                orderNumber: { type: 'string', description: 'Unique order number (e.g., PO-001)' },
                name: { type: 'string', description: 'Order name or product name' },
                customer: { type: 'string', description: 'Customer name' },
                priority: { type: 'string', description: 'Priority: high, medium, low' },
                status: { type: 'string', description: 'Status: released, planned, in-progress, completed' },
                quantity: { type: 'number', description: 'Order quantity' },
                dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
                description: { type: 'string', description: 'Order description' },
              },
              required: ['orderNumber', 'name', 'customer', 'priority', 'status', 'quantity', 'description'],
              additionalProperties: false,
            },
          },
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Operation name' },
                description: { type: 'string', description: 'Operation description' },
                duration: { type: 'number', description: 'Operation duration in hours' },
                requiredCapabilities: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of required capability names',
                },
              },
              required: ['name', 'description', 'duration', 'requiredCapabilities'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      totalRecords: {
        type: 'number',
        description: 'Total number of records generated across all types',
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of recommendations for using this data',
      },
    },
    required: ['summary', 'dataTypes', 'totalRecords', 'recommendations'],
    additionalProperties: false,
  },
};

/**
 * Retry helper with exponential backoff
 * Attempts operation up to maxAttempts times with increasing delays
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${maxAttempts} for ${operationName}`);
      const result = await operation();
      if (attempt > 1) {
        console.log(`[Retry] ✅ ${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxAttempts;

      if (isLastAttempt) {
        console.error(`[Retry] ❌ ${operationName} failed after ${maxAttempts} attempts:`, error.message);
        break;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[Retry] ⚠️ ${operationName} attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxAttempts} attempts`);
}

/**
 * Parse and validate AI response using Zod schema
 */
export function validateAISampleDataResponse(data: unknown): AISampleDataResponse {
  try {
    return AISampleDataResponseSchema.parse(data);
  } catch (error: any) {
    console.error('[AI Sample Data] Validation error:', error);
    throw new Error(`Invalid AI response format: ${error.message}`);
  }
}
