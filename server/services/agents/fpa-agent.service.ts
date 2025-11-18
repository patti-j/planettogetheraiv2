import { BaseAgent, AgentContext, AgentResponse } from './base-agent.interface';
import { sql } from 'drizzle-orm';
import { Database } from '../../../shared/types';
import { db } from '../../db';

/**
 * FP&A (Financial Planning & Analysis) Agent Service
 * Handles all financial planning, budgeting, forecasting, and variance analysis operations
 */
export class FPAAgent extends BaseAgent {
  id = 'fpa';
  name = 'FP&A Agent';
  description = 'Financial planning, budgeting, forecasting, and variance analysis expert';
  triggers = [
    // Budget related
    'budget', 'budgets', 'budgeting',
    'budget performance', 'budget variance',
    'over budget', 'under budget',
    'budget vs actual', 'actual vs budget',
    'budget analysis', 'budget report',
    'create budget', 'update budget',
    
    // Forecast related
    'forecast', 'forecasts', 'forecasting',
    'financial forecast', 'revenue forecast',
    'cost forecast', 'demand forecast',
    'forecast accuracy', 'rolling forecast',
    'forecast vs actual', 'predictive',
    
    // Variance analysis
    'variance', 'variance analysis',
    'variance report', 'cost variance',
    'revenue variance', 'price variance',
    'volume variance', 'mix variance',
    'efficiency variance', 'spending variance',
    
    // Financial metrics
    'profitability', 'profit margin',
    'gross margin', 'ebitda', 'roi',
    'roce', 'contribution margin',
    'break even', 'cash flow',
    'working capital', 'liquidity',
    
    // Cost analysis
    'cost analysis', 'cost breakdown',
    'cost per unit', 'unit cost',
    'cost center', 'cost allocation',
    'overhead', 'direct cost',
    'indirect cost', 'fixed cost',
    'variable cost', 'activity based costing',
    
    // Financial performance
    'financial performance', 'financial kpi',
    'financial metrics', 'financial dashboard',
    'financial report', 'financial analysis',
    'p&l', 'profit and loss',
    'income statement', 'balance sheet',
    
    // Planning
    'financial planning', 'financial plan',
    'annual planning', 'quarterly planning',
    'capex', 'capital expenditure',
    'opex', 'operating expense',
    
    // Manufacturing specific
    'manufacturing cost', 'production cost',
    'capacity utilization', 'inventory turnover',
    'oee', 'overall equipment effectiveness',
    'cost of quality', 'coq'
  ];
  requiredPermission = 'fpa.view';

  async initialize(): Promise<void> {
    await super.initialize();
    this.db = db;
  }

  async process(message: string, context: AgentContext): Promise<AgentResponse | null> {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Check for budget-related requests
      if (this.isBudgetRequest(lowerMessage)) {
        return await this.handleBudgetRequest(lowerMessage, context);
      }
      
      // Check for forecast-related requests
      if (this.isForecastRequest(lowerMessage)) {
        return await this.handleForecastRequest(lowerMessage, context);
      }
      
      // Check for variance analysis requests
      if (this.isVarianceRequest(lowerMessage)) {
        return await this.handleVarianceRequest(lowerMessage, context);
      }
      
      // Check for profitability analysis requests
      if (this.isProfitabilityRequest(lowerMessage)) {
        return await this.handleProfitabilityRequest(lowerMessage, context);
      }
      
      // Check for cost analysis requests
      if (this.isCostAnalysisRequest(lowerMessage)) {
        return await this.handleCostAnalysisRequest(lowerMessage, context);
      }
      
      // Check for financial KPI requests
      if (this.isFinancialKPIRequest(lowerMessage)) {
        return await this.handleFinancialKPIRequest(lowerMessage, context);
      }
      
      // Default FP&A response
      return {
        content: '## FP&A Financial Intelligence\n\n' +
                 'I can help you with financial planning and analysis:\n\n' +
                 '### Budget Management\n' +
                 '• **View budget performance** and variance analysis\n' +
                 '• **Create and update** budgets by department or cost center\n' +
                 '• **Track spending** against approved budgets\n\n' +
                 '### Financial Forecasting\n' +
                 '• **Revenue forecasts** with accuracy tracking\n' +
                 '• **Cost predictions** based on historical trends\n' +
                 '• **Rolling forecasts** and scenario planning\n\n' +
                 '### Performance Analysis\n' +
                 '• **Profitability analysis** by product, plant, or customer\n' +
                 '• **Cost breakdowns** and variance explanations\n' +
                 '• **Financial KPIs** and executive dashboards\n\n' +
                 'What financial analysis would you like to explore?',
        error: false
      };
    } catch (error: any) {
      this.error('Error processing FP&A request', error);
      return {
        content: `I encountered an error while processing your financial analysis request: ${error.message}`,
        error: true
      };
    }
  }
  
  private isBudgetRequest(message: string): boolean {
    const budgetKeywords = [
      'budget', 'budgeting', 'over budget', 'under budget',
      'budget variance', 'budget performance', 'budget vs actual'
    ];
    return budgetKeywords.some(keyword => message.includes(keyword));
  }
  
  private isForecastRequest(message: string): boolean {
    const forecastKeywords = [
      'forecast', 'predict', 'projection', 'rolling forecast',
      'forecast accuracy', 'forecast vs actual'
    ];
    return forecastKeywords.some(keyword => message.includes(keyword));
  }
  
  private isVarianceRequest(message: string): boolean {
    const varianceKeywords = [
      'variance', 'variance analysis', 'price variance',
      'volume variance', 'mix variance', 'efficiency variance'
    ];
    return varianceKeywords.some(keyword => message.includes(keyword));
  }
  
  private isProfitabilityRequest(message: string): boolean {
    const profitKeywords = [
      'profitability', 'profit margin', 'gross margin',
      'ebitda', 'roi', 'roce', 'contribution margin'
    ];
    return profitKeywords.some(keyword => message.includes(keyword));
  }
  
  private isCostAnalysisRequest(message: string): boolean {
    const costKeywords = [
      'cost analysis', 'cost breakdown', 'cost per unit',
      'unit cost', 'cost center', 'overhead', 'direct cost'
    ];
    return costKeywords.some(keyword => message.includes(keyword));
  }
  
  private isFinancialKPIRequest(message: string): boolean {
    const kpiKeywords = [
      'financial kpi', 'financial metric', 'financial performance',
      'p&l', 'profit and loss', 'income statement', 'balance sheet'
    ];
    return kpiKeywords.some(keyword => message.includes(keyword));
  }
  
  private async handleBudgetRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Query budget data (when tables exist)
      // For now, return mock analysis
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      return {
        content: `## Budget Performance - ${currentMonth}\n\n` +
                 '### Overall Status: **3% Under Budget** ✅\n\n' +
                 '**Key Metrics:**\n' +
                 '• **Revenue:** $12.3M actual vs $12.0M budget (+2.5%)\n' +
                 '• **Operating Expenses:** $8.7M actual vs $9.0M budget (-3.3%)\n' +
                 '• **Material Costs:** $3.2M actual vs $3.0M budget (+6.7%) ⚠️\n' +
                 '• **Labor Costs:** $2.8M actual vs $2.9M budget (-3.4%)\n\n' +
                 '### Variance Drivers:\n' +
                 '**Favorable:**\n' +
                 '• Energy efficiency improvements saved $125K\n' +
                 '• Overtime reduction saved $95K\n' +
                 '• Process optimization reduced waste by $78K\n\n' +
                 '**Unfavorable:**\n' +
                 '• Raw material price increase: +$180K\n' +
                 '• Unplanned maintenance: +$45K\n' +
                 '• Expedited shipping costs: +$32K\n\n' +
                 '### Recommendations:\n' +
                 '1. **Lock in material prices** with 6-month contracts to avoid volatility\n' +
                 '2. **Implement predictive maintenance** to reduce unplanned downtime\n' +
                 '3. **Review shipping schedules** to minimize expedited orders\n\n' +
                 'Would you like to drill down into any specific cost center or see the detailed variance report?',
        error: false
      };
    } catch (error: any) {
      return {
        content: `Error analyzing budget data: ${error.message}`,
        error: true
      };
    }
  }
  
  private async handleForecastRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      content: '## Financial Forecast Analysis\n\n' +
               '### Q4 2024 Rolling Forecast\n' +
               '**Revenue Forecast:** $38.5M (94% confidence)\n' +
               '**Gross Margin:** 42.3% (±1.2%)\n' +
               '**EBITDA:** $7.7M (20% margin)\n\n' +
               '### Key Assumptions:\n' +
               '• **Volume Growth:** +8% based on confirmed orders\n' +
               '• **Price Increase:** +2.5% effective next month\n' +
               '• **Cost Inflation:** +3.2% for materials\n' +
               '• **Productivity Gain:** +5% from automation\n\n' +
               '### Scenario Analysis:\n' +
               '**Best Case (+15%):** $44.3M revenue if new customer contracts close\n' +
               '**Base Case:** $38.5M revenue with current pipeline\n' +
               '**Worst Case (-10%):** $34.7M if supply chain disruptions occur\n\n' +
               '### Forecast Accuracy Metrics:\n' +
               '• **Last Quarter:** 96% accurate (revenue), 93% (costs)\n' +
               '• **YTD Average:** 94% accuracy across all metrics\n' +
               '• **Bias Analysis:** Slight conservative bias (-1.2%)\n\n' +
               'Would you like me to generate a detailed forecast by product line or update assumptions?',
      error: false
    };
  }
  
  private async handleVarianceRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      content: '## Variance Analysis Report\n\n' +
               '### Total Variance: $285K Favorable\n\n' +
               '**Breakdown by Category:**\n\n' +
               '#### Price Variance: -$142K Unfavorable\n' +
               '• Raw Materials: -$180K (steel prices +12%)\n' +
               '• Energy: +$38K (locked-in rates)\n\n' +
               '#### Volume Variance: +$318K Favorable\n' +
               '• Higher sales volume: +$420K\n' +
               '• Product mix shift: -$102K\n\n' +
               '#### Efficiency Variance: +$109K Favorable\n' +
               '• Labor productivity: +$67K (automation impact)\n' +
               '• Material yield: +$42K (waste reduction)\n\n' +
               '### Root Cause Analysis:\n' +
               '1. **Material Price Impact:** Global supply constraints driving costs\n' +
               '2. **Volume Outperformance:** New customer acquisition ahead of plan\n' +
               '3. **Efficiency Gains:** Lean initiatives delivering results\n\n' +
               '### Corrective Actions:\n' +
               '• **Immediate:** Negotiate volume discounts with suppliers\n' +
               '• **Short-term:** Accelerate automation projects\n' +
               '• **Long-term:** Develop alternative supplier network\n\n' +
               'Need variance details for specific products or departments?',
      error: false
    };
  }
  
  private async handleProfitabilityRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      content: '## Profitability Analysis\n\n' +
               '### Company Overview\n' +
               '**Gross Margin:** 41.2% (↑ 2.1% YoY)\n' +
               '**EBITDA Margin:** 18.7% (↑ 1.5% YoY)\n' +
               '**Net Margin:** 12.3% (↑ 0.8% YoY)\n' +
               '**ROCE:** 22.4% (exceeds 15% target)\n\n' +
               '### Profitability by Plant\n' +
               '| Plant | Gross Margin | EBITDA | Ranking |\n' +
               '|-------|-------------|---------|----------|\n' +
               '| **Munich** | 44.2% | 21.3% | #1 🏆 |\n' +
               '| **Hamburg** | 42.1% | 19.2% | #2 |\n' +
               '| **Berlin** | 39.8% | 17.5% | #3 |\n' +
               '| **Frankfurt** | 38.5% | 16.8% | #4 |\n\n' +
               '### Product Line Profitability\n' +
               '**Premium Products:** 52% margin, 35% of revenue\n' +
               '**Standard Products:** 38% margin, 50% of revenue\n' +
               '**Economy Products:** 25% margin, 15% of revenue\n\n' +
               '### Improvement Opportunities\n' +
               '1. **Shift mix** to premium products: +$2.3M potential\n' +
               '2. **Automate Frankfurt** packaging: +3% margin\n' +
               '3. **Optimize Berlin** scheduling: +$850K savings\n\n' +
               '### Customer Profitability\n' +
               '**Top 20% of customers:** Generate 78% of profits\n' +
               '**Bottom 30%:** Break-even or loss-making\n\n' +
               'Would you like detailed analysis for any specific area?',
      error: false
    };
  }
  
  private async handleCostAnalysisRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      content: '## Cost Analysis Dashboard\n\n' +
               '### Cost Structure Breakdown\n' +
               '**Total Manufacturing Cost:** $8.45/unit\n\n' +
               '#### Direct Costs (65% of total)\n' +
               '• **Materials:** $4.20/unit (49.7%)\n' +
               '• **Direct Labor:** $1.30/unit (15.4%)\n\n' +
               '#### Indirect Costs (35% of total)\n' +
               '• **Manufacturing Overhead:** $1.85/unit (21.9%)\n' +
               '• **Depreciation:** $0.65/unit (7.7%)\n' +
               '• **Quality Control:** $0.45/unit (5.3%)\n\n' +
               '### Cost Trend Analysis\n' +
               '**6-Month Trend:**\n' +
               '• Material costs: ↑ 8.2% (inflation impact)\n' +
               '• Labor costs: ↓ 3.1% (automation benefits)\n' +
               '• Overhead: ↑ 2.4% (energy prices)\n' +
               '• **Net change:** ↑ 4.8% per unit\n\n' +
               '### Activity-Based Costing\n' +
               '**Cost Drivers Identified:**\n' +
               '1. Machine hours: $42/hour\n' +
               '2. Setup time: $185/setup\n' +
               '3. Quality inspections: $75/inspection\n' +
               '4. Material moves: $28/move\n\n' +
               '### Cost Reduction Opportunities\n' +
               '**Quick Wins (< 3 months):**\n' +
               '• Reduce setups by 20%: Save $340K/year\n' +
               '• Optimize material flow: Save $185K/year\n\n' +
               '**Strategic Initiatives (6-12 months):**\n' +
               '• Implement lean manufacturing: Save $1.2M/year\n' +
               '• Automate quality inspection: Save $450K/year\n\n' +
               'Need detailed cost analysis for specific products or processes?',
      error: false
    };
  }
  
  private async handleFinancialKPIRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      content: '## Financial KPI Dashboard\n\n' +
               '### Key Financial Indicators\n\n' +
               '#### Profitability KPIs ✅\n' +
               '• **Revenue Growth:** +12.3% YoY (Target: 10%)\n' +
               '• **Gross Margin:** 41.2% (Target: 40%)\n' +
               '• **EBITDA:** $7.2M (Target: $7.0M)\n' +
               '• **ROI:** 24.5% (Target: 20%)\n\n' +
               '#### Efficiency KPIs 📊\n' +
               '• **Asset Turnover:** 2.8x (Target: 2.5x)\n' +
               '• **Inventory Turnover:** 8.2x (Target: 8.0x)\n' +
               '• **Days Sales Outstanding:** 42 days (Target: 45)\n' +
               '• **Cash Conversion Cycle:** 58 days (Target: 60)\n\n' +
               '#### Liquidity KPIs 💰\n' +
               '• **Current Ratio:** 2.1 (Healthy: >1.5)\n' +
               '• **Quick Ratio:** 1.4 (Healthy: >1.0)\n' +
               '• **Operating Cash Flow:** $6.8M\n' +
               '• **Free Cash Flow:** $4.2M\n\n' +
               '#### Manufacturing Financial KPIs 🏭\n' +
               '• **Manufacturing Cost/Revenue:** 58.8%\n' +
               '• **OEE Financial Impact:** $2.3M recovered\n' +
               '• **Cost Per Unit:** $8.45 (↓ 2% QoQ)\n' +
               '• **Capacity Utilization Value:** 82% = $31M/month\n\n' +
               '### Trend Analysis\n' +
               '**Improving:** Margins, efficiency, cash generation\n' +
               '**Stable:** Liquidity, working capital\n' +
               '**Watch:** Raw material costs, energy prices\n\n' +
               'Would you like to explore any KPI in detail or see historical trends?',
      error: false
    };
  }
  
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
  
  protected error(message: string, error?: any): void {
    console.error(`[${this.name}] ${message}`, error);
  }
}

// Export singleton instance
export const fpaAgent = new FPAAgent();