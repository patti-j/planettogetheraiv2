export type AdHocReportId =
  | "late_jobs_overview"
  | "late_jobs_by_customer"
  | "resource_utilization"
  | "changeover_time_by_resource"
  | "on_time_delivery"
  | "wip_aging"
  | "setup_vs_run_time"
  | "capacity_load_vs_available"
  | "bottleneck_operations"
  | "inventory_coverage"
  | "schedule_stability"
  | "oee_summary";

export interface AdHocReportColumn {
  id: string;
  label: string;
  format?: "text" | "number" | "currency" | "percent" | "duration" | "date";
}

export interface AdHocReportTemplate {
  id: AdHocReportId;
  name: string;
  description: string;
  triggerKeywords: string[];
  examplePrompts: string[];
  requiredFilters: string[];
  optionalFilters: string[];
  groupBy: string[];
  columns: AdHocReportColumn[];
  defaultSort?: { by: string; direction: "asc" | "desc" };
  dataSourceHint?: {
    table?: string;
    joins?: string[];
  };
}

export const ACTION_SYNONYMS = [
  "give me",
  "show",
  "display",
  "list",
  "produce",
  "generate",
  "create",
  "pull",
  "run",
  "build",
  "prepare",
  "get",
  "fetch",
  "export",
];

export const REPORT_SYNONYMS = [
  "report",
  "summary",
  "listing",
  "list",
  "overview",
  "chart",
  "graph",
  "table",
  "view",
  "analysis",
  "breakdown",
];

const lateJobsOverview: AdHocReportTemplate = {
  id: "late_jobs_overview",
  name: "Late Jobs Overview",
  description: "Shows all late jobs with days late, need dates, and priorities.",
  triggerKeywords: [
    "late jobs",
    "overdue jobs",
    "behind schedule",
    "past due orders",
    "late orders",
    "overdue orders",
    "delayed jobs",
  ],
  examplePrompts: [
    "Show me a summary of late jobs for this week",
    "Give me a listing of overdue orders",
    "Display a report of jobs that are behind schedule",
    "Generate a table of all past-due production orders",
    "Which jobs are running late?",
  ],
  requiredFilters: [],
  optionalFilters: ["dateRange", "plant", "customer", "priority"],
  groupBy: ["priority"],
  columns: [
    { id: "jobNumber", label: "Job #", format: "text" },
    { id: "jobName", label: "Job Name", format: "text" },
    { id: "needDate", label: "Need Date", format: "date" },
    { id: "scheduledEnd", label: "Scheduled End", format: "date" },
    { id: "daysLate", label: "Days Late", format: "number" },
    { id: "priority", label: "Priority", format: "number" },
    { id: "status", label: "Status", format: "text" },
  ],
  defaultSort: { by: "daysLate", direction: "desc" },
  dataSourceHint: { table: "ptjobs" },
};

const bottleneckOperations: AdHocReportTemplate = {
  id: "bottleneck_operations",
  name: "Bottleneck Operations",
  description: "Top operations by queue time, duration, or lateness risk.",
  triggerKeywords: [
    "bottleneck operations",
    "bottlenecks",
    "longest queues",
    "constraint operations",
    "where are my bottlenecks",
    "operations with long wait times",
    "longest operations",
    "slowest operations",
  ],
  examplePrompts: [
    "Show me the top 20 bottleneck operations by queue time",
    "Give me a listing of operations causing most lateness",
    "Generate a graph of queue time by resource",
    "Where are my bottlenecks this week?",
    "Which operations are bottlenecks?",
  ],
  requiredFilters: [],
  optionalFilters: ["dateRange", "plant", "resource"],
  groupBy: ["resourceName"],
  columns: [
    { id: "operationName", label: "Operation", format: "text" },
    { id: "jobName", label: "Job", format: "text" },
    { id: "resourceName", label: "Resource", format: "text" },
    { id: "totalHours", label: "Total Hours", format: "number" },
    { id: "setupHours", label: "Setup Hours", format: "number" },
    { id: "cycleHours", label: "Cycle Hours", format: "number" },
    { id: "priority", label: "Priority", format: "number" },
  ],
  defaultSort: { by: "totalHours", direction: "desc" },
  dataSourceHint: { table: "ptjoboperations" },
};

const resourceUtilization: AdHocReportTemplate = {
  id: "resource_utilization",
  name: "Resource Utilization",
  description: "Utilization%, loaded hours, and idle hours by resource and period.",
  triggerKeywords: [
    "resource utilization",
    "machine utilization",
    "capacity usage",
    "load vs capacity",
    "work center utilization",
    "how busy",
    "resource load",
    "equipment utilization",
  ],
  examplePrompts: [
    "Show a utilization report by machine for this week",
    "Give me a chart of resource utilization by day",
    "Generate a summary of capacity usage by work center",
    "How busy are my resources next week?",
    "Resource utilization summary",
  ],
  requiredFilters: [],
  optionalFilters: ["dateRange", "plant", "resourceGroup", "shift"],
  groupBy: ["resourceId"],
  columns: [
    { id: "resourceName", label: "Resource", format: "text" },
    { id: "resourceType", label: "Type", format: "text" },
    { id: "scheduledHours", label: "Scheduled Hours", format: "number" },
    { id: "operationCount", label: "Operations", format: "number" },
    { id: "utilizationPct", label: "Utilization %", format: "percent" },
  ],
  defaultSort: { by: "scheduledHours", direction: "desc" },
  dataSourceHint: { table: "ptresources" },
};

const wipAging: AdHocReportTemplate = {
  id: "wip_aging",
  name: "WIP Aging",
  description: "Shows in-process jobs bucketed by aging bands.",
  triggerKeywords: [
    "wip aging",
    "work in process aging",
    "aging report",
    "jobs stuck in wip",
    "wip report",
    "in progress jobs",
    "jobs in progress",
    "work in progress",
  ],
  examplePrompts: [
    "Show me a WIP aging report by work center",
    "Give me a listing of jobs in WIP more than 10 days",
    "Generate an aging summary of work in process",
    "WIP aging report",
    "Which jobs are stuck in progress?",
  ],
  requiredFilters: [],
  optionalFilters: ["plant", "resourceGroup"],
  groupBy: ["agingBucket"],
  columns: [
    { id: "jobName", label: "Job", format: "text" },
    { id: "currentOperation", label: "Current Operation", format: "text" },
    { id: "resourceName", label: "Resource", format: "text" },
    { id: "percentComplete", label: "% Complete", format: "percent" },
    { id: "daysInProgress", label: "Days In Progress", format: "number" },
    { id: "agingBucket", label: "Aging Bucket", format: "text" },
  ],
  defaultSort: { by: "daysInProgress", direction: "desc" },
  dataSourceHint: { table: "ptjobs" },
};

const onTimeDelivery: AdHocReportTemplate = {
  id: "on_time_delivery",
  name: "On-Time Delivery Performance",
  description: "On-time / late counts and percentages for a period.",
  triggerKeywords: [
    "on time delivery",
    "otd",
    "service level",
    "delivery performance",
    "on-time rate",
    "delivery rate",
  ],
  examplePrompts: [
    "Give me a monthly on-time delivery summary",
    "Show a chart of OTD by customer",
    "Generate a delivery performance report for last quarter",
    "What's our on-time delivery rate?",
  ],
  requiredFilters: [],
  optionalFilters: ["dateRange", "customer", "plant"],
  groupBy: ["period"],
  columns: [
    { id: "period", label: "Period", format: "date" },
    { id: "totalOrders", label: "Total Orders", format: "number" },
    { id: "onTimeOrders", label: "On-Time Orders", format: "number" },
    { id: "lateOrders", label: "Late Orders", format: "number" },
    { id: "onTimePct", label: "On-Time %", format: "percent" },
  ],
  defaultSort: { by: "period", direction: "asc" },
  dataSourceHint: { table: "ptjobs" },
};

const setupVsRunTime: AdHocReportTemplate = {
  id: "setup_vs_run_time",
  name: "Setup vs Run Time by Resource",
  description: "Compares setup hours vs run hours for each machine.",
  triggerKeywords: [
    "setup versus run",
    "setup vs run",
    "time breakdown",
    "utilization breakdown",
    "setup time analysis",
    "setup hours",
    "changeover time",
  ],
  examplePrompts: [
    "Create a report of setup vs run time by machine for last month",
    "Show a chart of setup hours as a % of total",
    "Generate a summary of run time vs setup time",
    "Setup time analysis by resource",
  ],
  requiredFilters: [],
  optionalFilters: ["dateRange", "plant", "resourceGroup"],
  groupBy: ["resourceName"],
  columns: [
    { id: "resourceName", label: "Resource", format: "text" },
    { id: "setupHours", label: "Setup Hrs", format: "number" },
    { id: "runHours", label: "Run Hrs", format: "number" },
    { id: "totalHours", label: "Total Hrs", format: "number" },
    { id: "setupPct", label: "Setup %", format: "percent" },
  ],
  defaultSort: { by: "setupPct", direction: "desc" },
  dataSourceHint: { table: "ptjoboperations" },
};

const capacityLoadVsAvailable: AdHocReportTemplate = {
  id: "capacity_load_vs_available",
  name: "Capacity Load vs Available",
  description: "Shows required capacity vs available capacity by resource and period.",
  triggerKeywords: [
    "capacity report",
    "load vs capacity",
    "finite capacity",
    "required hours",
    "capacity analysis",
    "overloaded resources",
  ],
  examplePrompts: [
    "Display a capacity load vs available report by work center for next 4 weeks",
    "Give me a graph of required hours vs capacity by machine",
    "Generate a summary of overloaded resources",
    "Capacity analysis by resource",
  ],
  requiredFilters: [],
  optionalFilters: ["dateRange", "plant", "resourceGroup"],
  groupBy: ["resourceName"],
  columns: [
    { id: "resourceName", label: "Resource", format: "text" },
    { id: "availableHours", label: "Available Hrs", format: "number" },
    { id: "requiredHours", label: "Required Hrs", format: "number" },
    { id: "loadPct", label: "Load %", format: "percent" },
    { id: "overloadHours", label: "Overload Hrs", format: "number" },
  ],
  defaultSort: { by: "loadPct", direction: "desc" },
  dataSourceHint: { table: "ptresources" },
};

export const ADHOC_REPORT_TEMPLATES: AdHocReportTemplate[] = [
  lateJobsOverview,
  bottleneckOperations,
  resourceUtilization,
  wipAging,
  onTimeDelivery,
  setupVsRunTime,
  capacityLoadVsAvailable,
];

export function getReportTemplateById(id: AdHocReportId): AdHocReportTemplate | undefined {
  return ADHOC_REPORT_TEMPLATES.find(t => t.id === id);
}

export function findMatchingTemplates(message: string): AdHocReportTemplate[] {
  const lower = message.toLowerCase();
  return ADHOC_REPORT_TEMPLATES.filter(template =>
    template.triggerKeywords.some(keyword => lower.includes(keyword))
  );
}
