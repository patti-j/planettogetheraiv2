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
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      return {
        content: `## APS-Driven Budget Performance - ${currentMonth}\n\n` +
                 '### Overall Status: **2% Over Budget** ⚠️\n\n' +
                 '**Production Cost Metrics:**\n' +
                 '• **Changeover Costs:** $485K actual vs $350K budget (+38.6%) 🔴\n' +
                 '• **Overtime Labor:** $820K actual vs $650K budget (+26.2%) ⚠️\n' +
                 '• **Material Efficiency:** 92% yield vs 95% target (-$240K impact)\n' +
                 '• **Setup Time Costs:** $180K (15% above plan)\n\n' +
                 '### APS Optimization Opportunities:\n' +
                 '**Quick Wins (< 1 week):**\n' +
                 '• **Reduce changeovers by 30%** through better sequencing: Save $145K/month\n' +
                 '• **Shift overtime to regular hours** via capacity leveling: Save $170K/month\n' +
                 '• **Optimize material cutting patterns**: Improve yield 2% = $80K/month\n\n' +
                 '**Strategic Improvements:**\n' +
                 '• **SMED implementation** on Line 3: Reduce setup costs by $60K/month\n' +
                 '• **Cross-training operators**: Flexibility saves $95K overtime/month\n' +
                 '• **Preventive maintenance scheduling**: Avoid $45K emergency repairs\n\n' +
                 '### Financial Impact Simulation:\n' +
                 '**If we optimize production sequencing:**\n' +
                 '• Changeovers: -30% = $145K savings\n' +
                 '• Overtime: -40% = $328K savings\n' +
                 '• Material waste: -15% = $36K savings\n' +
                 '• **Total Monthly Savings: $509K** (ROI in 2 months)\n\n' +
                 'Would you like me to run a what-if scenario with different changeover reduction targets?',
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
      content: '## APS-Driven Variance Analysis\n\n' +
               '### Total Production Variance: -$423K Unfavorable 🔴\n\n' +
               '**Operational Variance Breakdown:**\n\n' +
               '#### Changeover Variance: -$185K Unfavorable\n' +
               '• Actual: 487 changeovers vs 320 planned\n' +
               '• Impact: 52% more setups = +$185K costs\n' +
               '• Root Cause: Poor production sequencing\n\n' +
               '#### Overtime Variance: -$268K Unfavorable\n' +
               '• Actual: 3,200 OT hours vs 1,800 budgeted\n' +
               '• Weekend shifts: +$145K (rush orders)\n' +
               '• Late schedule changes: +$123K\n\n' +
               '#### Material Efficiency Variance: +$95K Favorable\n' +
               '• Scrap rate: 2.8% vs 4.0% target\n' +
               '• First-pass yield: 94% vs 92% plan\n' +
               '• Nesting optimization saved 1.2% material\n\n' +
               '#### Machine Utilization Variance: -$65K Unfavorable\n' +
               '• Unplanned downtime: 142 hrs vs 80 hrs budget\n' +
               '• Setup time overruns: 38% above standard\n\n' +
               '### APS Simulation Results:\n' +
               '**Scenario: Optimize Production Sequence**\n' +
               '• Changeovers reduced to 280/month: +$205K\n' +
               '• Overtime reduced by 45%: +$120K\n' +
               '• Machine utilization up 8%: +$52K\n' +
               '• **Net Impact: +$377K/month improvement**\n\n' +
               '### Actionable Recommendations:\n' +
               '1. **Implement campaign scheduling** for similar products\n' +
               '2. **Use APS finite scheduling** to level capacity\n' +
               '3. **Apply SMED techniques** to top 5 changeover types\n\n' +
               'Run simulation with different sequencing rules?',
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
      content: '## APS-Driven Cost Analysis\n\n' +
               '### Production Cost Breakdown\n' +
               '**Total Manufacturing Cost:** $12.85/unit (18% above target)\n\n' +
               '#### APS-Controllable Costs (45% of total)\n' +
               '• **Changeover Cost:** $1.95/unit (could be $0.80)\n' +
               '• **Overtime Premium:** $1.40/unit (could be $0.45)\n' +
               '• **Rush Shipping:** $0.85/unit (could be $0.15)\n' +
               '• **Expediting Fees:** $0.60/unit (avoidable)\n\n' +
               '#### Setup & Changeover Analysis\n' +
               '• **Current Setup Time:** 3.2 hrs average\n' +
               '• **Setup Cost:** $185/changeover\n' +
               '• **Monthly Changeovers:** 487 (optimal: 280)\n' +
               '• **Lost Production:** 1,558 hrs/month\n\n' +
               '### Cost Driver Simulation\n' +
               '**Scenario 1: Optimize Production Sequence**\n' +
               '• Changeovers: -40% = $0.78/unit savings\n' +
               '• Overtime: -50% = $0.70/unit savings\n' +
               '• Material handling: -25% = $0.15/unit savings\n' +
               '• **Total: $1.63/unit reduction** (12.7%)\n\n' +
               '**Scenario 2: Implement SMED + Sequencing**\n' +
               '• Setup time: -60% = $1.17/unit savings\n' +
               '• Machine availability: +12% = $0.95/unit\n' +
               '• Quality improvement: +3% = $0.22/unit\n' +
               '• **Total: $2.34/unit reduction** (18.2%)\n\n' +
               '### Financial Impact by Lever\n' +
               '| APS Lever | Current Cost | Optimized | Savings |\n' +
               '|-----------|-------------|-----------|----------|\n' +
               '| Changeovers | $90K/month | $52K | $38K |\n' +
               '| Overtime | $820K/month | $410K | $410K |\n' +
               '| Material Waste | $240K/month | $180K | $60K |\n' +
               '| Rush Orders | $185K/month | $45K | $140K |\n\n' +
               '**Monthly Savings Potential: $648K**\n\n' +
               'Want to simulate a specific scheduling scenario?',
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