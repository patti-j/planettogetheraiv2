import { BaseAgent, AgentContext, AgentResponse } from './base-agent.interface';
import { 
  ADHOC_REPORT_TEMPLATES, 
  ACTION_SYNONYMS, 
  REPORT_SYNONYMS, 
  AdHocReportTemplate,
  AdHocReportId 
} from './adhoc-reporting-templates';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

export class AdHocReportingAgent extends BaseAgent {
  id = 'adhoc_reporting';
  name = 'Ad-Hoc Reporting Agent';
  description = 'Generates on-demand reports for late jobs, bottlenecks, resource utilization, WIP aging, and more.';
  triggers = [
    'late jobs', 'overdue', 'behind schedule', 'past due',
    'bottleneck', 'bottlenecks', 'constraint',
    'utilization', 'capacity', 'load',
    'wip', 'work in process', 'work in progress', 'aging',
    'on time delivery', 'otd', 'service level',
    'setup time', 'changeover', 'setup vs run',
    'report', 'summary', 'listing', 'analysis',
  ];
  requiredPermission = undefined;

  async initialize(): Promise<void> {
    await super.initialize();
    this.log('Ad-Hoc Reporting Agent initialized with ' + ADHOC_REPORT_TEMPLATES.length + ' report templates');
  }

  canHandle(message: string): boolean {
    const lower = message.toLowerCase();
    
    const hasActionWord = ACTION_SYNONYMS.some(w => lower.includes(w));
    const hasReportWord = REPORT_SYNONYMS.some(w => lower.includes(w));
    const hitsTemplateKeyword = ADHOC_REPORT_TEMPLATES.some(tpl =>
      tpl.triggerKeywords.some(kw => lower.includes(kw))
    );
    
    return (hasActionWord || hasReportWord) && hitsTemplateKeyword;
  }

  async process(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      const template = this.pickBestTemplate(message);
      
      if (!template) {
        return {
          content: this.getHelpResponse(),
          error: false
        };
      }

      const filters = this.extractFilters(message, context);
      
      const reportData = await this.executeReport(template, filters, context);
      
      return {
        content: reportData.content,
        action: {
          type: 'open_report',
          data: {
            reportId: template.id,
            reportName: template.name,
            filters,
            data: reportData.data,
            columns: template.columns
          }
        },
        error: false
      };
    } catch (error: any) {
      this.error('Error processing report request', error);
      return {
        content: `I encountered an error generating the report: ${error.message}`,
        error: true
      };
    }
  }

  private pickBestTemplate(message: string): AdHocReportTemplate | null {
    const lower = message.toLowerCase();
    let best: { score: number; tpl: AdHocReportTemplate } | null = null;

    for (const tpl of ADHOC_REPORT_TEMPLATES) {
      let score = 0;

      for (const kw of tpl.triggerKeywords) {
        if (lower.includes(kw)) {
          score += 3 + kw.split(' ').length;
        }
      }
      
      for (const ex of tpl.examplePrompts) {
        const words = ex.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (w.length > 4 && lower.includes(w)) {
            score += 0.5;
          }
        }
      }

      if (!best || score > best.score) {
        best = { score, tpl };
      }
    }

    if (!best || best.score < 2) return null;
    return best.tpl;
  }

  private extractFilters(message: string, context: AgentContext): Record<string, any> {
    const lower = message.toLowerCase();
    const filters: Record<string, any> = {
      userId: context.userId,
    };

    if (lower.includes('this week')) {
      filters.dateRange = 'this_week';
    } else if (lower.includes('next week')) {
      filters.dateRange = 'next_week';
    } else if (lower.includes('this month')) {
      filters.dateRange = 'this_month';
    } else if (lower.includes('last month')) {
      filters.dateRange = 'last_month';
    } else if (lower.includes('today')) {
      filters.dateRange = 'today';
    } else if (lower.includes('next 7 days') || lower.includes('next seven days')) {
      filters.dateRange = 'next_7_days';
    } else if (lower.includes('next 14 days') || lower.includes('next two weeks')) {
      filters.dateRange = 'next_14_days';
    } else if (lower.includes('next 30 days')) {
      filters.dateRange = 'next_30_days';
    }

    if (lower.includes('high priority') || lower.includes('priority 1')) {
      filters.priority = 1;
    } else if (lower.includes('priority 2')) {
      filters.priority = 2;
    }

    const topMatch = lower.match(/top\s+(\d+)/);
    if (topMatch) {
      filters.limit = parseInt(topMatch[1], 10);
    }

    return filters;
  }

  private async executeReport(
    template: AdHocReportTemplate, 
    filters: Record<string, any>,
    context: AgentContext
  ): Promise<{ content: string; data: any[] }> {
    switch (template.id) {
      case 'late_jobs_overview':
        return await this.executeLateJobsReport(filters);
      case 'bottleneck_operations':
        return await this.executeBottleneckReport(filters);
      case 'resource_utilization':
        return await this.executeUtilizationReport(filters);
      case 'wip_aging':
        return await this.executeWipAgingReport(filters);
      case 'on_time_delivery':
        return await this.executeOtdReport(filters);
      case 'setup_vs_run_time':
        return await this.executeSetupVsRunReport(filters);
      case 'capacity_load_vs_available':
        return await this.executeCapacityReport(filters);
      default:
        return { content: 'Report type not yet implemented.', data: [] };
    }
  }

  private async executeLateJobsReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const limit = filters.limit || 20;
    
    const result = await db.execute(sql`
      SELECT 
        j.id,
        j.external_id as job_number,
        j.name as job_name,
        j.need_date_time as need_date,
        j.priority,
        j.status,
        MAX(jo.scheduled_end) as scheduled_end,
        EXTRACT(DAY FROM (MAX(jo.scheduled_end) - j.need_date_time)) as days_late
      FROM ptjobs j
      LEFT JOIN ptjoboperations jo ON j.id = jo.job_id
      WHERE j.need_date_time IS NOT NULL
        AND MAX(jo.scheduled_end) > j.need_date_time
      GROUP BY j.id, j.external_id, j.name, j.need_date_time, j.priority, j.status
      HAVING MAX(jo.scheduled_end) > j.need_date_time
      ORDER BY days_late DESC NULLS LAST
      LIMIT ${limit}
    `).catch(async () => {
      return await db.execute(sql`
        SELECT 
          j.id,
          j.external_id as job_number,
          j.name as job_name,
          j.need_date_time as need_date,
          j.priority,
          j.status,
          j.need_date_time as scheduled_end,
          0 as days_late
        FROM ptjobs j
        WHERE j.need_date_time < NOW()
          AND j.status != 'Completed'
        ORDER BY j.need_date_time ASC
        LIMIT ${limit}
      `);
    });

    const rows = result.rows as any[];
    
    if (rows.length === 0) {
      return { 
        content: '**Late Jobs Report**\n\nNo late jobs found. All jobs are on schedule.', 
        data: [] 
      };
    }

    const highPriorityLate = rows.filter(r => r.priority <= 2).length;
    
    let content = `**Late Jobs Report**\n\n`;
    content += `**Summary:** You have **${rows.length} late jobs**`;
    if (highPriorityLate > 0) {
      content += `, ${highPriorityLate} of them high priority`;
    }
    content += '.\n\n';

    content += '**Key Metrics:**\n';
    content += `- Total late jobs: ${rows.length}\n`;
    content += `- High priority late (P1-P2): ${highPriorityLate}\n`;
    if (rows.length > 0 && rows[0].days_late) {
      content += `- Most late: ${rows[0].job_name || rows[0].job_number} (${Math.round(rows[0].days_late)} days)\n`;
    }
    content += '\n';

    content += '**Top Late Jobs:**\n\n';
    content += '| Job | Name | Need Date | Priority | Days Late |\n';
    content += '|-----|------|-----------|----------|----------|\n';
    
    for (const row of rows.slice(0, 10)) {
      const needDate = row.need_date ? new Date(row.need_date).toLocaleDateString() : 'N/A';
      const daysLate = row.days_late ? Math.round(row.days_late) : 'N/A';
      content += `| ${row.job_number || row.id} | ${row.job_name || '-'} | ${needDate} | ${row.priority || '-'} | ${daysLate} |\n`;
    }

    content += '\n*Download to Excel for full report.*';

    return { content, data: rows };
  }

  private async executeBottleneckReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const limit = filters.limit || 15;
    
    const result = await db.execute(sql`
      SELECT 
        jo.id,
        jo.name as operation_name,
        j.name as job_name,
        j.priority,
        r.name as resource_name,
        r.resource_type,
        jo.cycle_hrs,
        jo.setup_hours,
        (COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) as total_hours
      FROM ptjoboperations jo
      JOIN ptjobs j ON jo.job_id = j.id
      LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
      LEFT JOIN ptresources r ON jr.default_resource_id = r.id::text
      WHERE jo.percent_finished < 100
      ORDER BY (COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) DESC
      LIMIT ${limit}
    `);

    const rows = result.rows as any[];
    
    if (rows.length === 0) {
      return { 
        content: '**Bottleneck Operations Report**\n\nNo pending operations found to analyze.', 
        data: [] 
      };
    }

    const totalBottleneckHours = rows.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
    const resourceCounts = new Map<string, number>();
    rows.forEach(r => {
      const name = r.resource_name || 'Unassigned';
      resourceCounts.set(name, (resourceCounts.get(name) || 0) + 1);
    });
    
    let content = `**Bottleneck Operations Report**\n\n`;
    content += `**Summary:** Found **${rows.length} potential bottleneck operations** totaling ${Math.round(totalBottleneckHours)} hours.\n\n`;

    content += '**Key Metrics:**\n';
    content += `- Total bottleneck hours: ${Math.round(totalBottleneckHours)}\n`;
    content += `- Longest operation: ${rows[0]?.operation_name} (${Math.round(rows[0]?.total_hours || 0)} hrs)\n`;
    const topResource = [...resourceCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topResource) {
      content += `- Most constrained resource: ${topResource[0]} (${topResource[1]} operations)\n`;
    }
    content += '\n';

    content += '**Top Bottleneck Operations:**\n\n';
    content += '| Operation | Job | Resource | Total Hours | Setup | Cycle |\n';
    content += '|-----------|-----|----------|-------------|-------|-------|\n';
    
    for (const row of rows.slice(0, 10)) {
      const totalHrs = Math.round((row.total_hours || 0) * 10) / 10;
      const setupHrs = Math.round((row.setup_hours || 0) * 10) / 10;
      const cycleHrs = Math.round((row.cycle_hrs || 0) * 10) / 10;
      content += `| ${row.operation_name || '-'} | ${row.job_name || '-'} | ${row.resource_name || 'Unassigned'} | ${totalHrs} | ${setupHrs} | ${cycleHrs} |\n`;
    }

    content += '\n*Consider running ASAP algorithm on high-priority bottleneck operations.*';

    return { content, data: rows };
  }

  private async executeUtilizationReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const limit = filters.limit || 20;
    
    const result = await db.execute(sql`
      SELECT 
        r.id,
        r.name as resource_name,
        r.resource_type,
        r.available_hours,
        COUNT(DISTINCT jo.id) as operation_count,
        SUM(COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) as scheduled_hours,
        CASE 
          WHEN r.available_hours > 0 
          THEN ROUND((SUM(COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) / r.available_hours * 100)::numeric, 1)
          ELSE 0
        END as utilization_pct
      FROM ptresources r
      LEFT JOIN ptjobresources jr ON r.id::text = jr.default_resource_id
      LEFT JOIN ptjoboperations jo ON jr.operation_id = jo.id
        AND jo.scheduled_start >= NOW() - INTERVAL '7 days'
        AND jo.scheduled_end <= NOW() + INTERVAL '14 days'
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.resource_type, r.available_hours
      ORDER BY scheduled_hours DESC NULLS LAST
      LIMIT ${limit}
    `);

    const rows = result.rows as any[];
    
    if (rows.length === 0) {
      return { 
        content: '**Resource Utilization Report**\n\nNo active resources found.', 
        data: [] 
      };
    }

    const busyResources = rows.filter(r => parseFloat(r.utilization_pct) > 80);
    const idleResources = rows.filter(r => parseFloat(r.utilization_pct) < 30);
    
    let content = `**Resource Utilization Report** (Last 7 / Next 14 days)\n\n`;
    content += `**Summary:** ${busyResources.length} resources >80% utilized, ${idleResources.length} resources <30% utilized.\n\n`;

    content += '**Key Metrics:**\n';
    content += `- Total resources analyzed: ${rows.length}\n`;
    content += `- Highly utilized (>80%): ${busyResources.length}\n`;
    content += `- Under-utilized (<30%): ${idleResources.length}\n`;
    content += '\n';

    content += '**Resource Utilization:**\n\n';
    content += '| Resource | Type | Scheduled Hrs | Operations | Utilization |\n';
    content += '|----------|------|---------------|------------|-------------|\n';
    
    for (const row of rows.slice(0, 15)) {
      const schedHrs = Math.round((parseFloat(row.scheduled_hours) || 0) * 10) / 10;
      const util = row.utilization_pct || 0;
      content += `| ${row.resource_name || '-'} | ${row.resource_type || '-'} | ${schedHrs} | ${row.operation_count || 0} | ${util}% |\n`;
    }

    content += '\n*Consider load balancing from highly utilized to under-utilized resources.*';

    return { content, data: rows };
  }

  private async executeWipAgingReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const limit = filters.limit || 20;
    
    const result = await db.execute(sql`
      SELECT 
        j.id,
        j.name as job_name,
        j.external_id as job_number,
        j.status,
        jo.name as current_operation,
        r.name as resource_name,
        jo.percent_finished,
        j.start_date_time,
        EXTRACT(DAY FROM (NOW() - j.start_date_time)) as days_in_progress,
        CASE 
          WHEN EXTRACT(DAY FROM (NOW() - j.start_date_time)) <= 3 THEN '0-3 days'
          WHEN EXTRACT(DAY FROM (NOW() - j.start_date_time)) <= 7 THEN '4-7 days'
          WHEN EXTRACT(DAY FROM (NOW() - j.start_date_time)) <= 14 THEN '8-14 days'
          ELSE '>14 days'
        END as aging_bucket
      FROM ptjobs j
      LEFT JOIN ptjoboperations jo ON j.id = jo.job_id AND jo.percent_finished > 0 AND jo.percent_finished < 100
      LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
      LEFT JOIN ptresources r ON jr.default_resource_id = r.id::text
      WHERE j.status = 'In Progress' OR (j.start_date_time IS NOT NULL AND j.status != 'Completed')
      ORDER BY days_in_progress DESC NULLS LAST
      LIMIT ${limit}
    `);

    const rows = result.rows as any[];
    
    if (rows.length === 0) {
      return { 
        content: '**WIP Aging Report**\n\nNo jobs currently in progress.', 
        data: [] 
      };
    }

    const buckets = new Map<string, number>();
    rows.forEach(r => {
      const bucket = r.aging_bucket || 'Unknown';
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });
    
    let content = `**WIP Aging Report**\n\n`;
    content += `**Summary:** ${rows.length} jobs currently in progress.\n\n`;

    content += '**Aging Breakdown:**\n';
    for (const [bucket, count] of buckets) {
      content += `- ${bucket}: ${count} jobs\n`;
    }
    content += '\n';

    content += '**Jobs In Progress:**\n\n';
    content += '| Job | Current Operation | Resource | % Complete | Days In Progress |\n';
    content += '|-----|-------------------|----------|------------|------------------|\n';
    
    for (const row of rows.slice(0, 15)) {
      const days = row.days_in_progress ? Math.round(row.days_in_progress) : 'N/A';
      const pct = row.percent_finished || 0;
      content += `| ${row.job_name || row.job_number || '-'} | ${row.current_operation || '-'} | ${row.resource_name || '-'} | ${pct}% | ${days} |\n`;
    }

    content += '\n*Focus on jobs >14 days in WIP for expediting.*';

    return { content, data: rows };
  }

  private async executeOtdReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN j.status = 'Completed' AND j.need_date_time >= NOW() THEN 1 ELSE 0 END) as on_time_orders,
        SUM(CASE WHEN j.need_date_time < NOW() AND j.status != 'Completed' THEN 1 ELSE 0 END) as late_orders
      FROM ptjobs j
      WHERE j.need_date_time IS NOT NULL
    `);

    const summary = result.rows[0] as any;
    const total = parseInt(summary.total_orders) || 0;
    const onTime = parseInt(summary.on_time_orders) || 0;
    const late = parseInt(summary.late_orders) || 0;
    const otdPct = total > 0 ? Math.round((onTime / total) * 100) : 0;

    let content = `**On-Time Delivery Report**\n\n`;
    content += `**Summary:** OTD is **${otdPct}%** (${onTime} of ${total} jobs on time).\n\n`;

    content += '**Key Metrics:**\n';
    content += `- Total orders: ${total}\n`;
    content += `- On-time orders: ${onTime}\n`;
    content += `- Late orders: ${late}\n`;
    content += `- On-Time %: ${otdPct}%\n`;

    return { 
      content, 
      data: [{ total_orders: total, on_time_orders: onTime, late_orders: late, otd_pct: otdPct }] 
    };
  }

  private async executeSetupVsRunReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const limit = filters.limit || 15;
    
    const result = await db.execute(sql`
      SELECT 
        r.name as resource_name,
        r.resource_type,
        SUM(COALESCE(jo.setup_hours, 0)) as setup_hours,
        SUM(COALESCE(jo.cycle_hrs, 0)) as run_hours,
        SUM(COALESCE(jo.setup_hours, 0) + COALESCE(jo.cycle_hrs, 0)) as total_hours,
        CASE 
          WHEN SUM(COALESCE(jo.setup_hours, 0) + COALESCE(jo.cycle_hrs, 0)) > 0 
          THEN ROUND((SUM(COALESCE(jo.setup_hours, 0)) / SUM(COALESCE(jo.setup_hours, 0) + COALESCE(jo.cycle_hrs, 0)) * 100)::numeric, 1)
          ELSE 0
        END as setup_pct
      FROM ptresources r
      LEFT JOIN ptjobresources jr ON r.id::text = jr.default_resource_id
      LEFT JOIN ptjoboperations jo ON jr.operation_id = jo.id
      WHERE jo.id IS NOT NULL
      GROUP BY r.id, r.name, r.resource_type
      HAVING SUM(COALESCE(jo.setup_hours, 0) + COALESCE(jo.cycle_hrs, 0)) > 0
      ORDER BY setup_pct DESC
      LIMIT ${limit}
    `);

    const rows = result.rows as any[];
    
    if (rows.length === 0) {
      return { 
        content: '**Setup vs Run Time Report**\n\nNo operation data available for analysis.', 
        data: [] 
      };
    }

    const highSetupResources = rows.filter(r => parseFloat(r.setup_pct) > 30);
    
    let content = `**Setup vs Run Time Report**\n\n`;
    content += `**Summary:** ${highSetupResources.length} resources have >30% setup time.\n\n`;

    content += '**Resources by Setup %:**\n\n';
    content += '| Resource | Setup Hrs | Run Hrs | Total Hrs | Setup % |\n';
    content += '|----------|-----------|---------|-----------|--------|\n';
    
    for (const row of rows.slice(0, 12)) {
      const setup = Math.round((parseFloat(row.setup_hours) || 0) * 10) / 10;
      const run = Math.round((parseFloat(row.run_hours) || 0) * 10) / 10;
      const total = Math.round((parseFloat(row.total_hours) || 0) * 10) / 10;
      content += `| ${row.resource_name || '-'} | ${setup} | ${run} | ${total} | ${row.setup_pct}% |\n`;
    }

    content += '\n*Consider campaign scheduling to reduce changeovers on high-setup resources.*';

    return { content, data: rows };
  }

  private async executeCapacityReport(filters: Record<string, any>): Promise<{ content: string; data: any[] }> {
    const limit = filters.limit || 15;
    
    const result = await db.execute(sql`
      SELECT 
        r.name as resource_name,
        r.resource_type,
        COALESCE(r.available_hours, 40) as available_hours,
        SUM(COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) as required_hours,
        CASE 
          WHEN COALESCE(r.available_hours, 40) > 0 
          THEN ROUND((SUM(COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) / COALESCE(r.available_hours, 40) * 100)::numeric, 1)
          ELSE 0
        END as load_pct,
        GREATEST(0, SUM(COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) - COALESCE(r.available_hours, 40)) as overload_hours
      FROM ptresources r
      LEFT JOIN ptjobresources jr ON r.id::text = jr.default_resource_id
      LEFT JOIN ptjoboperations jo ON jr.operation_id = jo.id
        AND jo.scheduled_start >= NOW()
        AND jo.scheduled_end <= NOW() + INTERVAL '14 days'
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.resource_type, r.available_hours
      HAVING SUM(COALESCE(jo.cycle_hrs, 0) + COALESCE(jo.setup_hours, 0)) > 0
      ORDER BY load_pct DESC
      LIMIT ${limit}
    `);

    const rows = result.rows as any[];
    
    if (rows.length === 0) {
      return { 
        content: '**Capacity Load vs Available Report**\n\nNo scheduled work found in the next 14 days.', 
        data: [] 
      };
    }

    const overloaded = rows.filter(r => parseFloat(r.load_pct) > 100);
    
    let content = `**Capacity Load vs Available Report** (Next 14 days)\n\n`;
    content += `**Summary:** ${overloaded.length} resources are overloaded (>100% capacity).\n\n`;

    content += '**Capacity Analysis:**\n\n';
    content += '| Resource | Available Hrs | Required Hrs | Load % | Overload Hrs |\n';
    content += '|----------|---------------|--------------|--------|-------------|\n';
    
    for (const row of rows.slice(0, 12)) {
      const avail = Math.round((parseFloat(row.available_hours) || 0) * 10) / 10;
      const req = Math.round((parseFloat(row.required_hours) || 0) * 10) / 10;
      const over = Math.round((parseFloat(row.overload_hours) || 0) * 10) / 10;
      content += `| ${row.resource_name || '-'} | ${avail} | ${req} | ${row.load_pct}% | ${over} |\n`;
    }

    content += '\n*Consider adding shifts or redistributing work from overloaded resources.*';

    return { content, data: rows };
  }

  private getHelpResponse(): string {
    return `I can generate on-demand reports for you. Try asking for:\n\n` +
      `- **Late Jobs Report** - "Show me late jobs" or "Which jobs are overdue?"\n` +
      `- **Bottleneck Operations** - "Where are my bottlenecks?" or "Show bottleneck operations"\n` +
      `- **Resource Utilization** - "How busy are my resources?" or "Resource utilization report"\n` +
      `- **WIP Aging** - "WIP aging report" or "Jobs stuck in progress"\n` +
      `- **On-Time Delivery** - "What's our OTD rate?" or "On-time delivery summary"\n` +
      `- **Setup vs Run Time** - "Setup time analysis" or "Setup vs run time by resource"\n` +
      `- **Capacity Analysis** - "Capacity load report" or "Show overloaded resources"\n\n` +
      `You can also add filters like "this week", "high priority", or "top 10".`;
  }
}

export const adhocReportingAgent = new AdHocReportingAgent();
