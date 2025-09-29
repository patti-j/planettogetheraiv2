import { DataCatalogService } from './data-catalog';

interface SemanticMapping {
  term: string;
  tableName: string;
  columnName: string;
  confidence: number;
  context: string[];
  description?: string;
}

interface ChartIntent {
  measures: SemanticMapping[];
  dimensions: SemanticMapping[];
  aggregations: string[];
  filters: any[];
  timeGrain?: string;
  sort?: string;
  limit?: number;
  chartType?: string;
  confidence: number;
  rationale: string;
}

export class SemanticRegistry {
  private static instance: SemanticRegistry;
  private mappings: Map<string, SemanticMapping[]> = new Map();
  private dataCatalog: DataCatalogService;

  constructor() {
    this.dataCatalog = DataCatalogService.getInstance();
    this.initializeBuiltInMappings();
  }

  static getInstance(): SemanticRegistry {
    if (!SemanticRegistry.instance) {
      SemanticRegistry.instance = new SemanticRegistry();
    }
    return SemanticRegistry.instance;
  }

  // Initialize built-in semantic mappings for manufacturing domain
  private initializeBuiltInMappings() {
    const builtInMappings: SemanticMapping[] = [
      // Resource mappings
      { term: 'resource', tableName: 'ptresources', columnName: 'resource_name', confidence: 0.9, context: ['equipment', 'machine'], description: 'Manufacturing resource name' },
      { term: 'equipment', tableName: 'ptresources', columnName: 'resource_name', confidence: 0.85, context: ['resource', 'machine'], description: 'Equipment name' },
      { term: 'machine', tableName: 'ptresources', columnName: 'resource_name', confidence: 0.8, context: ['resource', 'equipment'], description: 'Machine name' },
      
      // Plant/Location mappings
      { term: 'plant', tableName: 'ptresources', columnName: 'plant_name', confidence: 0.95, context: ['facility', 'location'], description: 'Plant or facility name' },
      { term: 'facility', tableName: 'ptresources', columnName: 'plant_name', confidence: 0.9, context: ['plant', 'location'], description: 'Manufacturing facility' },
      { term: 'location', tableName: 'ptresources', columnName: 'plant_name', confidence: 0.8, context: ['plant', 'facility'], description: 'Location name' },
      
      // Department mappings
      { term: 'department', tableName: 'ptresources', columnName: 'department_name', confidence: 0.9, context: ['area', 'division'], description: 'Department name' },
      { term: 'area', tableName: 'ptresources', columnName: 'department_name', confidence: 0.8, context: ['department', 'division'], description: 'Work area' },
      
      // Job mappings
      { term: 'job', tableName: 'ptjobs', columnName: 'job_name', confidence: 0.9, context: ['order', 'production'], description: 'Production job name' },
      { term: 'order', tableName: 'ptjobs', columnName: 'job_name', confidence: 0.85, context: ['job', 'production'], description: 'Production order' },
      { term: 'production', tableName: 'ptjobs', columnName: 'job_name', confidence: 0.8, context: ['job', 'order'], description: 'Production job' },
      
      // Priority mappings
      { term: 'priority', tableName: 'ptjobs', columnName: 'priority', confidence: 0.95, context: ['importance', 'urgency'], description: 'Job priority level' },
      { term: 'importance', tableName: 'ptjobs', columnName: 'priority', confidence: 0.8, context: ['priority', 'urgency'], description: 'Job importance' },
      
      // Status mappings
      { term: 'status', tableName: 'ptjobs', columnName: 'status', confidence: 0.9, context: ['state', 'condition'], description: 'Current status' },
      { term: 'state', tableName: 'ptjobs', columnName: 'status', confidence: 0.8, context: ['status', 'condition'], description: 'Current state' },
      
      // Operation mappings
      { term: 'operation', tableName: 'ptjoboperations', columnName: 'operation_name', confidence: 0.9, context: ['process', 'step'], description: 'Manufacturing operation' },
      { term: 'process', tableName: 'ptjoboperations', columnName: 'operation_name', confidence: 0.85, context: ['operation', 'step'], description: 'Manufacturing process' },
      { term: 'step', tableName: 'ptjoboperations', columnName: 'operation_name', confidence: 0.8, context: ['operation', 'process'], description: 'Process step' },
      
      // Common aggregation measures
      { term: 'count', tableName: '*', columnName: 'COUNT(*)', confidence: 0.95, context: ['number', 'total'], description: 'Count of records' },
      { term: 'total', tableName: '*', columnName: 'COUNT(*)', confidence: 0.9, context: ['count', 'number'], description: 'Total count' },
      { term: 'number', tableName: '*', columnName: 'COUNT(*)', confidence: 0.85, context: ['count', 'total'], description: 'Number of items' },
      
      // Compound mappings for common queries
      { term: 'jobs by plant', tableName: 'ptresources', columnName: 'plant_name', confidence: 0.95, context: ['job distribution', 'plant analysis'], description: 'Jobs grouped by plant - use cross-table JOIN to count jobs by plant' },
      { term: 'jobs by priority', tableName: 'ptjobs', columnName: 'priority', confidence: 0.95, context: ['priority analysis'], description: 'Jobs grouped by priority level' },
      { term: 'jobs by status', tableName: 'ptjobs', columnName: 'scheduled_status', confidence: 0.95, context: ['status analysis'], description: 'Jobs grouped by status' }
    ];

    // Group mappings by term
    for (const mapping of builtInMappings) {
      const term = mapping.term.toLowerCase();
      if (!this.mappings.has(term)) {
        this.mappings.set(term, []);
      }
      this.mappings.get(term)!.push(mapping);
    }
  }

  // Find semantic mappings for user terms
  async findMappings(term: string): Promise<SemanticMapping[]> {
    const normalizedTerm = term.toLowerCase().trim();
    const results: SemanticMapping[] = [];

    // Check built-in mappings first
    const builtInResults = this.mappings.get(normalizedTerm) || [];
    results.push(...builtInResults);

    // Dynamic discovery from data catalog
    const catalog = await this.dataCatalog.getCatalog();
    
    for (const table of catalog.tables) {
      for (const column of table.columns) {
        const columnName = column.name.toLowerCase();
        
        // Direct name match
        if (columnName.includes(normalizedTerm)) {
          results.push({
            term: normalizedTerm,
            tableName: table.name,
            columnName: column.name,
            confidence: this.calculateConfidence(normalizedTerm, columnName),
            context: table.tags,
            description: column.description || `${column.type} field`
          });
        }
        
        // Synonym matching for common terms
        if (this.isSemanticMatch(normalizedTerm, columnName, table.tags)) {
          results.push({
            term: normalizedTerm,
            tableName: table.name,
            columnName: column.name,
            confidence: this.calculateConfidence(normalizedTerm, columnName) * 0.8, // Lower confidence for indirect matches
            context: table.tags,
            description: column.description || `${column.type} field`
          });
        }
      }
    }

    // Sort by confidence and remove duplicates
    const uniqueResults = results.filter((mapping, index, self) => 
      index === self.findIndex(m => 
        m.tableName === mapping.tableName && 
        m.columnName === mapping.columnName
      )
    );

    return uniqueResults.sort((a, b) => b.confidence - a.confidence);
  }

  // Calculate confidence score for term-column matching
  private calculateConfidence(term: string, columnName: string): number {
    if (columnName === term) return 0.95;
    if (columnName.includes(term)) return 0.9;
    if (columnName.includes(term.substring(0, 4))) return 0.7;
    return 0.5;
  }

  // Check if term semantically matches column based on context
  private isSemanticMatch(term: string, columnName: string, tags: string[]): boolean {
    const semanticMappings: { [key: string]: string[] } = {
      'plant': ['facility', 'location', 'site'],
      'resource': ['equipment', 'machine', 'tool'],
      'job': ['order', 'production', 'batch'],
      'operation': ['process', 'step', 'activity'],
      'priority': ['importance', 'urgency', 'level'],
      'status': ['state', 'condition', 'phase']
    };

    const synonyms = semanticMappings[term] || [];
    return synonyms.some(synonym => 
      columnName.includes(synonym) || tags.includes(synonym)
    );
  }

  // Get available dimensions for charts
  async getAvailableDimensions(): Promise<SemanticMapping[]> {
    const catalog = await this.dataCatalog.getCatalog();
    const dimensions: SemanticMapping[] = [];

    for (const table of catalog.tables) {
      for (const column of table.columns) {
        // Consider categorical fields as dimensions
        if (this.isCategoricalField(column.type, column.distinctCount, table.rowCount)) {
          dimensions.push({
            term: column.name.toLowerCase(),
            tableName: table.name,
            columnName: column.name,
            confidence: 0.8,
            context: table.tags,
            description: column.description || `Categorical dimension`
          });
        }
      }
    }

    return dimensions;
  }

  // Get available measures for charts
  async getAvailableMeasures(): Promise<SemanticMapping[]> {
    const catalog = await this.dataCatalog.getCatalog();
    const measures: SemanticMapping[] = [];

    // Always include count as a measure
    measures.push({
      term: 'count',
      tableName: '*',
      columnName: 'COUNT(*)',
      confidence: 0.95,
      context: ['aggregation'],
      description: 'Count of records'
    });

    for (const table of catalog.tables) {
      for (const column of table.columns) {
        // Consider numeric fields as measures
        if (this.isNumericField(column.type)) {
          measures.push({
            term: column.name.toLowerCase(),
            tableName: table.name,
            columnName: column.name,
            confidence: 0.9,
            context: table.tags,
            description: column.description || `Numeric measure`
          });
        }
      }
    }

    return measures;
  }

  // Check if field is categorical (good for dimensions)
  private isCategoricalField(type: string, distinctCount?: number, rowCount?: number): boolean {
    const categoricalTypes = ['text', 'varchar', 'character varying', 'enum'];
    if (!categoricalTypes.some(t => type.toLowerCase().includes(t))) return false;
    
    // If we have stats, check cardinality
    if (distinctCount !== undefined && rowCount !== undefined) {
      const cardinality = distinctCount / Math.max(rowCount, 1);
      return cardinality < 0.5; // Less than 50% unique values
    }
    
    return true;
  }

  // Check if field is numeric (good for measures)
  private isNumericField(type: string): boolean {
    const numericTypes = ['integer', 'int', 'bigint', 'decimal', 'numeric', 'real', 'double', 'serial'];
    return numericTypes.some(t => type.toLowerCase().includes(t));
  }

  // Learn new mapping from successful queries
  addLearntMapping(term: string, tableName: string, columnName: string, context: string[]) {
    const normalizedTerm = term.toLowerCase();
    const mapping: SemanticMapping = {
      term: normalizedTerm,
      tableName,
      columnName,
      confidence: 0.8, // Start with moderate confidence for learned mappings
      context,
      description: `Learned mapping from user interaction`
    };

    if (!this.mappings.has(normalizedTerm)) {
      this.mappings.set(normalizedTerm, []);
    }
    
    this.mappings.get(normalizedTerm)!.push(mapping);
  }

  // Get summary of available data for AI clarification
  async getSummaryForClarification(): Promise<string> {
    const dimensions = await this.getAvailableDimensions();
    const measures = await this.getAvailableMeasures();
    
    const topDimensions = dimensions
      .slice(0, 5)
      .map(d => `${d.term} (${d.tableName})`)
      .join(', ');
      
    const topMeasures = measures
      .slice(0, 5) 
      .map(m => `${m.term} (${m.tableName})`)
      .join(', ');

    return `Available dimensions: ${topDimensions}\nAvailable measures: ${topMeasures}`;
  }
}

export const semanticRegistry = SemanticRegistry.getInstance();