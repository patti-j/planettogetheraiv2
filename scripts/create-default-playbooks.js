#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const defaultPlaybooks = [
  // Max AI - System Orchestrator
  {
    title: "Max AI System Orchestration Guide",
    description: "How to leverage Max AI for cross-functional analysis and system-wide optimization across all manufacturing domains",
    agentId: "max",
    category: "orchestration",
    tags: ["max-ai", "orchestration", "system-wide", "cross-functional", "coordination"],
    content: `# Max AI System Orchestration Guide

## Overview
Max AI serves as your system-wide orchestrator, coordinating multiple AI agents and providing holistic insights across all manufacturing operations. Use Max to get strategic recommendations and cross-domain analysis.

## When to Use Max AI
- **Complex Multi-Domain Questions**: When your question spans multiple areas (scheduling + quality + inventory)
- **Strategic Decision Making**: High-level operational decisions requiring system-wide visibility
- **Agent Coordination**: When you need multiple specialized agents working together
- **Holistic Performance Analysis**: Understanding how different areas interact and affect each other

## Key Capabilities

### 1. System-Wide Analysis
Max AI can analyze your entire operation at once:
- Overall Equipment Effectiveness (OEE) across all resources
- Cross-departmental bottleneck identification
- End-to-end process flow analysis
- Supply chain visibility from raw materials to finished goods

### 2. Agent Orchestration
Max coordinates specialized agents automatically:
- **Example**: "Optimize my schedule while maintaining quality standards and inventory targets"
  - Max engages Production Scheduling Agent for optimization
  - Quality Management Agent validates compliance
  - Inventory Planning Agent checks stock availability
  - Synthesizes results into unified recommendations

### 3. Strategic Insights
Get high-level business intelligence:
- Key performance indicator trends and patterns
- Production capacity vs. demand analysis
- Cost optimization opportunities across operations
- Resource utilization and efficiency metrics

## Best Practices

### Ask Holistic Questions
❌ "What's the status of Job 12345?"
✅ "How is our overall production performance today? Any critical issues requiring attention?"

### Leverage Cross-Functional Analysis
❌ "Schedule this job for tomorrow"
✅ "How should we schedule rush order #789 considering quality checks, material availability, and current bottlenecks?"

### Strategic Planning
❌ "Move operation 100 to Resource A"
✅ "What's our capacity utilization forecast for next month? Where should we focus improvement efforts?"

## Example Use Cases

### Morning Production Review
**Prompt**: "Max, give me a morning briefing on production status, critical jobs, resource conflicts, and any quality alerts."

**What Max Does**:
1. Checks Production Scheduling Agent for at-risk jobs
2. Queries Shop Floor Agent for real-time equipment status
3. Consults Quality Management Agent for recent issues
4. Reviews Inventory Planning Agent for material shortages
5. Synthesizes comprehensive morning report

### Strategic Capacity Planning
**Prompt**: "We have a new customer requiring 20% more capacity. What's the impact and how should we prepare?"

**What Max Does**:
1. Analyzes current capacity utilization (Production Scheduling)
2. Evaluates quality impact of increased volume (Quality Management)
3. Assesses material availability (Supply Planning + Inventory)
4. Calculates equipment requirements (Predictive Maintenance)
5. Provides comprehensive readiness plan

### Root Cause Analysis
**Prompt**: "Our on-time delivery dropped 15% last month. Why, and how do we fix it?"

**What Max Does**:
1. Examines schedule adherence patterns
2. Identifies quality holds and rework delays
3. Analyzes equipment downtime events
4. Reviews material shortage incidents
5. Prioritizes corrective actions by impact

## Integration with Specialized Agents

Max knows when to delegate to specialists:

| Scenario | Primary Agent | Max's Role |
|----------|---------------|------------|
| Detailed schedule optimization | Production Scheduling | Coordinate constraints from other domains |
| Real-time equipment issue | Shop Floor | Assess production impact and recovery options |
| Quality investigation | Quality Management | Evaluate scheduling/material factors |
| Demand forecast analysis | Demand Management | Integrate with capacity and supply planning |
| Equipment maintenance | Predictive Maintenance | Coordinate scheduling around maintenance windows |

## Tips for Maximum Effectiveness

### 1. Provide Context
The more context you provide, the better Max can help:
- Time horizons (today, this week, next quarter)
- Business priorities (cost, quality, delivery)
- Specific constraints or concerns

### 2. Ask Follow-Up Questions
Max maintains conversation context:
- "Tell me more about that bottleneck"
- "What if we add overtime shifts?"
- "How confident are you in that forecast?"

### 3. Use for Decision Support
Max excels at "what-if" analysis:
- "What happens if we delay Job A to prioritize Job B?"
- "Should we approve this rush order given our current load?"
- "Which improvement initiative has the highest ROI?"

## Advanced Features

### Multi-Agent Workflows
Max can orchestrate complex workflows automatically:
1. Schedule optimization with quality gates
2. Predictive maintenance integrated with production plans
3. Material shortage alerts with automatic schedule adjustments

### Learning from Feedback
Max improves recommendations based on:
- Decisions you make and their outcomes
- Performance metrics over time
- Your preferences and priorities

## Last Updated: November 2025`
  },

  // Production Scheduling Agent
  {
    title: "Production Scheduling Best Practices",
    description: "Comprehensive guide to production scheduling optimization, algorithm selection, bottleneck management, and PlanetTogether APS concepts",
    agentId: "production_scheduling",
    category: "scheduling",
    tags: ["scheduling", "optimization", "ASAP", "ALAP", "bottleneck", "finite-capacity", "APS"],
    content: `# Production Scheduling Best Practices

## Overview
This playbook provides guidance on production scheduling optimization, algorithm selection, finite capacity planning, and manufacturing execution strategies using PlanetTogether concepts.

## Scheduling Algorithms

### ASAP (As Soon As Possible)
**When to Use**:
- Standard production scheduling
- Minimizing lead times
- Push-based manufacturing
- When delivery dates are flexible

**How It Works**:
1. Schedules jobs forward from today (or release date)
2. Respects job priority (1 = highest priority)
3. Maintains operation sequence order
4. Assigns resources based on availability

**Best For**:
- Make-to-stock operations
- Building inventory buffers
- Maximizing throughput
- Continuous flow manufacturing

### ALAP (As Late As Possible)
**When to Use**:
- Just-in-time manufacturing
- Minimizing work-in-process inventory
- Pull-based systems
- When due dates are critical

**How It Works**:
1. Schedules backward from due dates
2. Jobs sorted by priority descending (5→4→3→2→1)
3. Priority 1 jobs scheduled last (earliest start dates)
4. Maintains sequence constraints working backward

**Best For**:
- Make-to-order operations
- Reducing inventory carrying costs
- Synchronized delivery schedules
- Cash flow optimization

### Drum/TOC (Theory of Constraints)
**When to Use**:
- Known bottleneck resources
- Highly constrained systems
- Optimizing around critical equipment

**How It Works**:
1. Identifies primary bottleneck resource
2. Optimizes bottleneck schedule (longest operations first)
3. Subordinates all other resources to bottleneck
4. Protects bottleneck with time buffers

**Best For**:
- Pharmaceutical manufacturing (limited reactors)
- Bottleneck-dominated operations
- High-mix, low-volume production

## Finite Capacity Planning

### Capacity Constraints
**Resource Capacity**:
- Respects working calendar (shifts, breaks, holidays)
- Accounts for resource availability
- Enforces maximum concurrent operations
- Considers setup and teardown times

**Material Constraints**:
- Material availability dates
- Component lead times
- Supplier delivery schedules
- Safety stock requirements

**Quality Constraints**:
- Mandatory inspection times
- Quality hold periods
- Testing equipment availability
- Compliance buffer times

### Scheduling Priorities
Jobs are scheduled by priority (1-10 scale):
- **Priority 1**: Critical/rush orders (scheduled first in ASAP, last/earliest in ALAP)
- **Priority 2-3**: Important customer orders
- **Priority 4-6**: Standard production
- **Priority 7-9**: Stock replenishment
- **Priority 10**: Filler/low-priority work

## Bottleneck Management

### Identifying Bottlenecks
**Indicators**:
- Resource utilization >90%
- Growing queue of waiting operations
- Longest cumulative operation time
- Causes most schedule delays

**Analysis Tools**:
- Resource utilization charts
- Load profiles over time
- Gantt chart visual inspection
- Queue time analysis

### Managing Bottlenecks
**Protective Strategies**:
1. **Schedule Ahead**: Give bottlenecks 2-3x standard lead time
2. **Buffer Inventory**: Maintain WIP before bottleneck
3. **Minimize Setup**: Batch similar products on bottleneck
4. **Protect Uptime**: Prioritize bottleneck maintenance
5. **Add Capacity**: Overtime, additional shifts, equipment

**Subordination Strategies**:
- Fast non-bottleneck setups to feed bottleneck
- Flexible resources backup bottleneck
- Cross-training for bottleneck operations
- Off-load work from bottleneck where possible

## PlanetTogether APS Concepts

### Pegging
**Order Pegging**:
- Trace demand back through supply chain
- Links finished goods → operations → materials
- Shows which orders drive which operations
- Enables impact analysis of changes

**Resource Pegging**:
- Shows which operations depend on each resource
- Identifies shared resource conflicts
- Highlights critical path operations

### Constraint Management
**Hard Constraints** (Cannot Violate):
- Resource capacity limits
- Material availability dates
- Mandatory sequence dependencies
- Compliance-required buffers

**Soft Constraints** (Preferential):
- Preferred resources
- Target completion dates
- Minimize changeovers
- Load balancing goals

### What-If Scenarios
**Scenario Analysis**:
- Save current schedule as baseline
- Make changes (add jobs, change dates, modify capacity)
- Compare scenarios side-by-side
- Rollback to previous version

**Common Scenarios**:
- Rush order impact analysis
- Equipment downtime recovery
- Capacity expansion planning
- New product introduction

## Manual Scheduling Override

### When to Schedule Manually
- Special customer requirements
- Coordination with external events
- Specific resource preferences
- Known operational constraints

### Manual Scheduling Features
**Drag & Drop**:
- Move operations to different times
- Assign to specific resources
- Adjust duration if needed
- System marks as "manually_scheduled"

**Protection**:
- Manually scheduled operations locked
- Algorithms skip manual operations
- Preserved during re-optimization
- Clear visual indicators

**Best Practice**:
- Manual schedule exceptions only
- Document reasons for manual changes
- Review manual schedules regularly
- Re-optimize when possible

## Resource Allocation

### Resource Selection
**Criteria**:
1. **Capability**: Can resource perform operation?
2. **Availability**: Is resource free during time window?
3. **Efficiency**: Resource-specific run rates
4. **Preference**: Preferred resources for quality/speed

### Multi-Resource Operations
**Simultaneous Resources**:
- Operations requiring operator + machine
- All resources must be available simultaneously
- Scheduled as atomic unit
- Any resource conflict blocks operation

### Alternative Resources
**Substitution**:
- Define primary and alternate resources
- Automatic selection if primary unavailable
- Different run rates per resource
- Flexibility vs. consistency trade-off

## Production Version Management

### SAP Production Versions
**Version Structure**:
- Material + Plant + Version ID
- Valid date ranges (from/to)
- Routing and BOM assignment
- Resource group mapping

**Usage**:
- Multiple manufacturing methods
- Seasonal variations
- Equipment-specific processes
- Continuous improvement versions

## Performance Optimization

### Schedule Optimization Goals
1. **Maximize Throughput**: Total units produced
2. **Minimize Lead Time**: Time from release to completion
3. **Balance Load**: Even resource utilization
4. **Reduce Setup**: Batch similar products
5. **Meet Due Dates**: On-time delivery performance

### KPIs to Track
- **Schedule Adherence**: Actual vs. planned completion
- **Resource Utilization**: Productive time vs. available time
- **Queue Time**: Time waiting for resources
- **Cycle Time**: Total time through system
- **Late Orders**: Count and days late

## Troubleshooting Common Issues

### Jobs Not Scheduling
**Causes**:
- Material not available
- No capable resources
- Constraints conflict
- Invalid date ranges

**Solutions**:
- Check material availability dates
- Verify resource capabilities
- Review constraint settings
- Validate calendars

### Resource Conflicts
**Causes**:
- Overlapping operations
- Insufficient capacity
- Concurrent operation limits exceeded

**Solutions**:
- Stagger operation start times
- Add alternative resources
- Split operations across resources
- Adjust priorities

### Poor Schedule Quality
**Causes**:
- Wrong algorithm selection
- Incorrect priorities
- Missing constraints
- Unrealistic targets

**Solutions**:
- Match algorithm to manufacturing strategy
- Review and adjust job priorities
- Add missing constraints
- Validate capacity assumptions

## Integration with Other Agents

### Quality Management
- Schedule quality inspection operations
- Include hold times for test results
- Buffer time for potential rework

### Predictive Maintenance
- Coordinate maintenance windows
- Avoid scheduling during PM
- Plan around expected failures

### Inventory Planning
- Respect material availability
- Coordinate with procurement lead times
- Balance WIP inventory targets

## Last Updated: November 2025`
  },

  // Shop Floor Agent
  {
    title: "Shop Floor Monitoring and Response Guide",
    description: "Real-time shop floor monitoring, event response procedures, and operational decision-making for frontline operations",
    agentId: "shop_floor",
    category: "operations",
    tags: ["shop-floor", "real-time", "monitoring", "events", "operators", "production-tracking"],
    content: `# Shop Floor Monitoring and Response Guide

## Overview
The Shop Floor Agent provides real-time monitoring, event response, and operational support for manufacturing floor operations. This playbook covers best practices for shop floor management and rapid issue resolution.

## Real-Time Monitoring

### Equipment Status Tracking
**Monitor Continuously**:
- Machine run state (running, idle, down, setup)
- Current job and operation in progress
- Actual vs. planned cycle times
- Quality measurements and trends

**Status Indicators**:
- 🟢 **Green**: Running normally within parameters
- 🟡 **Yellow**: Running with warnings or minor issues
- 🔴 **Red**: Down, blocked, or critical issue
- ⚪ **Gray**: Idle/available for work

### Production Progress
**Real-Time Updates**:
- Operations completed today
- Current job completion percentage
- Remaining time estimates
- Queue of upcoming operations

**Performance Metrics**:
- Actual vs. standard run rates
- Setup time tracking
- Downtime duration and reasons
- Scrap and rework quantities

## Event Response Procedures

### Equipment Breakdown
**Immediate Actions**:
1. **Document**: Record time, machine, and symptoms
2. **Assess**: Severity and production impact
3. **Notify**: Maintenance team and supervisor
4. **Reassign**: Move operations to backup resources if available

**Recovery**:
- Estimate repair time
- Reschedule affected operations
- Update job completion estimates
- Communicate delays to planning

### Material Shortage
**Response Protocol**:
1. **Verify**: Check actual inventory vs. system
2. **Escalate**: Contact material planning immediately
3. **Alternative**: Check for substitute materials
4. **Adjust**: Pause affected jobs, prioritize others

**Documentation**:
- Material part number and quantity needed
- Job(s) affected
- Expected arrival time
- Impact on delivery dates

### Quality Issue Detected
**Containment**:
1. **Stop Production**: Place job on hold immediately
2. **Quarantine**: Segregate affected units
3. **Notify**: Quality management and supervisor
4. **Document**: Issue description, quantity affected

**Investigation**:
- Collect samples and data
- Review process parameters
- Check equipment calibration
- Interview operator

### Operator Absence
**Immediate Response**:
1. **Check**: Cross-trained backup operators
2. **Reassign**: Shift operations to qualified personnel
3. **Adjust**: Extend timelines if reduced capacity
4. **Escalate**: If critical skills shortage

## Operator Assistance

### Work Instructions
**Provide Access To**:
- Standard operating procedures (SOPs)
- Safety protocols and PPE requirements
- Quality inspection criteria
- Equipment operating manuals

**Just-In-Time Training**:
- Video guides for complex operations
- Step-by-step visual work instructions
- Troubleshooting flowcharts
- Quality checkpoints

### Data Entry and Reporting
**Operator Inputs**:
- Operation start/complete times
- Quantity produced (good and scrap)
- Downtime reasons and duration
- Quality measurements

**Real-Time Validation**:
- Check for data entry errors
- Alert on unusual values
- Confirm required fields completed
- Auto-calculate derived metrics

### Decision Support
**Common Questions**:
- "What operation should I start next?"
- "Is material available for Job X?"
- "Which resource should I use?"
- "Can I pause this job for a rush order?"

**AI Recommendations**:
- Next operation by priority
- Resource allocation suggestions
- Break schedule optimization
- Setup sequence to minimize changeovers

## Production Tracking

### Operation Completion
**Standard Process**:
1. **Start**: Record operation start time and resource
2. **Progress**: Update quantities periodically
3. **Complete**: Enter final quantity and end time
4. **Verify**: Confirm against standards

**Automatic Updates**:
- Job status and completion percentage
- Resource utilization hours
- Schedule variance (early/late)
- Downstream operation readiness

### Work-In-Process (WIP)
**Track Location and Status**:
- Current location (resource, staging area, inspection)
- Quantity at each stage
- Hold status and reasons
- Next operation and timing

**WIP Metrics**:
- Total WIP inventory value
- Average queue time per operation
- Longest-waiting jobs
- WIP by product/order

## Performance Monitoring

### Operator Performance
**Individual Metrics**:
- Operations completed per shift
- Actual vs. standard time
- Quality first-pass yield
- Safety incidents

**Team Metrics**:
- Shift production vs. target
- Overall equipment effectiveness (OEE)
- Downtime by reason code
- Schedule adherence

### Resource Performance
**Equipment Metrics**:
- Availability (% uptime)
- Performance (actual vs. ideal cycle time)
- Quality (% good units)
- OEE (Availability × Performance × Quality)

**Utilization Analysis**:
- Productive time
- Setup/changeover time
- Planned downtime (breaks, maintenance)
- Unplanned downtime (failures)

## Communication Protocols

### Shift Handover
**Information Transfer**:
- In-progress jobs and status
- Open issues and resolution plans
- Equipment condition notes
- Priority changes and rush orders

**Handover Checklist**:
✓ Review production board/digital display
✓ Walk through any unusual situations
✓ Confirm next shift priorities
✓ Transfer any physical materials or paperwork

### Escalation Paths
**Level 1 - Supervisor** (< 30 min):
- Minor equipment issues
- Standard material shortages
- Schedule adjustments

**Level 2 - Manager** (< 2 hrs):
- Major equipment failures
- Quality holds
- Customer escalations

**Level 3 - Operations Director** (> 2 hrs):
- Plant-wide issues
- Major customer impact
- Safety incidents

## Standard Operating Procedures

### Equipment Startup
1. **Safety Check**: Guards in place, E-stops functional
2. **Pre-Start**: Lubrication, tool checks, material loaded
3. **Warm-Up**: Run at reduced speed initially
4. **First-Piece**: Inspection before full production

### Equipment Shutdown
1. **Complete**: Finish or safely pause current operation
2. **Clean**: Remove scrap, clean work area
3. **Inspect**: Check for wear, damage, leaks
4. **Log**: Record hours, issues, next maintenance due

### Changeover Procedures
1. **Prepare**: Stage new materials and tools
2. **Remove**: Clean out previous product/setup
3. **Install**: New tooling, adjust settings
4. **Verify**: First-piece inspection and approval

## Quality Checkpoints

### In-Process Inspection
**Frequency**:
- First piece of every batch/shift
- Hourly for critical dimensions
- After adjustments or repairs
- Random sampling per procedure

**Inspection Points**:
- Critical dimensions and tolerances
- Visual defects (scratches, color, finish)
- Functional tests (fit, operation)
- Documentation and labeling

### Statistical Process Control (SPC)
**Control Charts**:
- X-bar and R charts for variables
- P and C charts for attributes
- Real-time plotting and trending
- Auto-alert on out-of-control conditions

**Response to Out-of-Control**:
1. Stop production immediately
2. Notify quality engineer
3. Investigate special cause
4. Implement corrective action
5. Resume only after verification

## Safety Protocols

### Daily Safety Checks
**Before Each Shift**:
- PPE inspection (gloves, glasses, hearing protection)
- Emergency stop button test
- Guard and interlock verification
- Housekeeping and clear walkways

### Incident Response
**Immediate Actions**:
1. **Secure**: Stop equipment, secure area
2. **Aid**: Provide first aid if needed
3. **Notify**: Supervisor and safety officer
4. **Document**: Incident report within 1 hour
5. **Investigate**: Root cause analysis

### Near-Miss Reporting
**Encourage Reporting**:
- No-blame culture
- Quick hazard resolution
- Recognition for proactive safety
- Share lessons learned

## Best Practices

### Continuous Improvement
- Daily team huddles (5-10 minutes)
- Weekly problem-solving sessions
- Visual management boards
- Standardized work documentation

### Operator Empowerment
- Authority to stop for quality/safety
- Input on process improvements
- Access to real-time data
- Recognition for suggestions

### Digital Tools
- Mobile apps for real-time data entry
- Digital displays for metrics and priorities
- Camera-based visual inspection assist
- Voice-activated commands (hands-free)

## Integration with Other Agents

### Production Scheduling
- Report actual completion times
- Communicate delays immediately
- Confirm material and resource availability
- Validate schedule feasibility

### Quality Management
- Real-time quality data sharing
- Alert on control chart violations
- Coordinate inspections and holds
- Track corrective action effectiveness

### Predictive Maintenance
- Report unusual equipment behavior
- Track actual vs. expected cycle times
- Log minor issues before failure
- Schedule maintenance during planned downtime

## Last Updated: November 2025`
  },

  // Quality Management Agent
  {
    title: "Quality Control and Compliance Management",
    description: "Quality monitoring procedures, compliance tracking, defect analysis, and continuous quality improvement strategies",
    agentId: "quality_management",
    category: "quality",
    tags: ["quality", "compliance", "SPC", "inspection", "defect-analysis", "GMP"],
    content: `# Quality Control and Compliance Management

## Overview
This playbook covers quality control monitoring, regulatory compliance, statistical process control (SPC), and continuous quality improvement for manufacturing operations.

## Quality Control Fundamentals

### Quality Planning
**Before Production Starts**:
- Define quality characteristics and specifications
- Establish sampling plans and inspection frequencies
- Identify critical control points
- Set up measurement systems and gauges

**Quality Documentation**:
- Quality Control Plans (QCP)
- Inspection and Test Plans (ITP)
- Standard Operating Procedures (SOPs)
- Work instructions with acceptance criteria

### Inspection Types

**Incoming Inspection**:
- Raw materials and components
- Supplier quality records review
- Certificate of Analysis (COA) verification
- Sample testing per approved protocols

**In-Process Inspection**:
- First-piece inspection (FPI)
- Patrol inspection during production
- Statistical process control (SPC) monitoring
- Critical attribute verification

**Final Inspection**:
- 100% inspection or sampling per plan
- Functional testing and validation
- Packaging and labeling verification
- Release documentation

## Statistical Process Control (SPC)

### Control Charts
**Variable Data (X-bar & R Charts)**:
- Monitor process average and variation
- Calculate control limits (±3 sigma)
- Plot measurements in real-time
- Detect shifts and trends

**Attribute Data (P & C Charts)**:
- Track defect rates and counts
- Monitor proportion nonconforming
- Identify process capability changes
- Trend analysis over time

### Control Rules
**Out-of-Control Signals**:
1. **Rule 1**: Point beyond control limit
2. **Rule 2**: 7+ consecutive points on one side of average
3. **Rule 3**: 6+ consecutive increasing or decreasing points
4. **Rule 4**: 14+ points alternating up and down
5. **Rule 5**: 2 of 3 consecutive points >2 sigma from centerline

**Response Protocol**:
- Stop production immediately
- Investigate special cause variation
- Implement corrective action
- Verify effectiveness before resuming

### Process Capability
**Capability Indices**:
- **Cp**: Process capability (spread vs. specification width)
  - Cp ≥ 1.33 = Capable process
- **Cpk**: Process capability considering centering
  - Cpk ≥ 1.33 = Centered and capable
  - Cpk < 1.0 = Process not capable

**Interpretation**:
- Cp = Cpk: Process is centered
- Cp > Cpk: Process is off-center
- Both < 1.0: Process needs improvement

## Defect Analysis

### Root Cause Analysis Methods

**5 Whys**:
1. Why did the defect occur? (Surface cause)
2. Why did that happen? (Deeper cause)
3. Why did that happen? (Contributing factor)
4. Why did that happen? (System issue)
5. Why did that happen? (Root cause)

**Fishbone Diagram (Ishikawa)**:
- **Man**: Operator training, fatigue, error
- **Machine**: Equipment calibration, wear, malfunction
- **Material**: Out-of-specification, contamination, variability
- **Method**: Procedure unclear, not followed, inadequate
- **Measurement**: Gauge accuracy, repeatability, method
- **Environment**: Temperature, humidity, cleanliness

**Failure Mode & Effects Analysis (FMEA)**:
- Identify potential failure modes
- Assess severity, occurrence, detection
- Calculate Risk Priority Number (RPN)
- Prioritize prevention and detection improvements

### Corrective and Preventive Actions (CAPA)

**Corrective Action** (After problem occurs):
1. **Immediate Containment**: Stop defect from reaching customer
2. **Root Cause Analysis**: Identify true cause(s)
3. **Corrective Action**: Eliminate root cause
4. **Verification**: Confirm effectiveness
5. **Documentation**: Record actions and results

**Preventive Action** (Before problem occurs):
- Analyze potential failures (FMEA)
- Implement controls to prevent occurrence
- Monitor leading indicators
- Continuous improvement initiatives

## Regulatory Compliance

### Good Manufacturing Practices (GMP)

**Core Principles**:
1. **Personnel**: Qualified, trained, healthy
2. **Facilities**: Clean, adequate, controlled
3. **Equipment**: Suitable, maintained, calibrated
4. **Materials**: Approved, identified, tested
5. **Production**: Controlled, documented, validated
6. **Quality Control**: Independent, comprehensive, documented

**Documentation Requirements**:
- Batch production records
- Laboratory test results
- Deviation and investigation reports
- Change control records
- Training records and qualifications

### FDA Compliance (For Pharmaceuticals/Medical Devices)

**21 CFR Part 11** (Electronic Records):
- Audit trails for all changes
- Electronic signatures with validation
- System validation and security
- Record retention per regulations

**Validation Requirements**:
- **IQ**: Installation Qualification
- **OQ**: Operational Qualification
- **PQ**: Performance Qualification
- **PPQ**: Process Performance Qualification

### ISO Standards

**ISO 9001** (Quality Management System):
- Customer focus and satisfaction
- Leadership and engagement
- Process approach
- Evidence-based decision making
- Continual improvement

**ISO 13485** (Medical Devices):
- Risk management throughout lifecycle
- Design controls and validation
- Supplier management
- Post-market surveillance

## Quality Metrics and KPIs

### Manufacturing Quality

**First Pass Yield (FPY)**:
- Formula: (Good units / Total units started) × 100%
- Target: >95% for most processes
- Tracks quality at each operation

**First Time Quality (FTQ)**:
- Formula: (Units passing first inspection / Total inspected) × 100%
- Target: >98%
- Measures right-first-time performance

**Defect Rate**:
- Defects per million opportunities (DPMO)
- Six Sigma level correlation
- Track by defect type and root cause

### Customer Quality

**Customer Complaints**:
- Count per period
- Rate per units shipped
- Response time to resolution
- Repeat complaint tracking

**Returns and Refunds**:
- Return rate percentage
- Cost of quality (COQ)
- Warranty claims
- Root cause analysis

**Customer Satisfaction**:
- Survey scores (CSAT)
- Net Promoter Score (NPS)
- On-time delivery quality
- Product conformance ratings

## Quality Hold and Release

### Quality Hold Procedures

**When to Hold**:
- Out-of-specification results
- Equipment malfunction during production
- Contamination or mix-up suspected
- Deviation from approved procedure

**Hold Process**:
1. **Segregate**: Physically separate and label
2. **Document**: Hold tag with reason and date
3. **Investigate**: Root cause analysis
4. **Disposition**: Accept, rework, scrap, or return
5. **Release**: Only after quality approval

### Release Criteria

**Batch Release Requirements**:
- All tests passed specifications
- Deviations resolved and closed
- Equipment calibration current
- Batch record complete and approved
- Quality manager signature

**Accelerated Release**:
- For time-sensitive products
- Requires validated quick tests
- Risk assessment documented
- Full testing completes in parallel

## Supplier Quality Management

### Supplier Qualification

**Initial Assessment**:
- Facility audit and capability review
- Quality system evaluation
- Sample testing and approval
- Supply agreement with quality requirements

**Ongoing Monitoring**:
- Incoming quality data trending
- Supplier scorecards (monthly/quarterly)
- Annual re-qualification audits
- Corrective action tracking

### Supplier Performance Metrics

**Quality Metrics**:
- Defect rate (ppm)
- Lot acceptance rate
- Certificate of Analysis (COA) accuracy
- Response time to quality issues

**Delivery Metrics**:
- On-time delivery percentage
- Lead time consistency
- Order fill rate
- Emergency responsiveness

## Laboratory Management

### Sample Management

**Chain of Custody**:
- Unique sample identification
- Collection date, time, person
- Storage conditions
- Testing assignments
- Retention requirements

**Sample Retention**:
- Retain per regulatory requirements
- Proper storage conditions (temp, light, humidity)
- Retention period (often 1 year beyond expiry)
- Disposal documentation

### Testing Protocols

**Method Validation**:
- Accuracy (trueness to true value)
- Precision (repeatability and reproducibility)
- Specificity (selectivity)
- Detection limit and quantitation limit
- Linearity and range
- Robustness

**Test Result Documentation**:
- Analyst name and date
- Raw data and calculations
- Equipment used and calibration status
- Acceptance criteria and pass/fail
- Reviewer approval

## Training and Competency

### Quality Training Programs

**New Employee Training**:
- GMP fundamentals
- Quality policies and procedures
- Job-specific quality requirements
- Documentation practices

**Refresher Training**:
- Annual GMP certification
- Procedure updates
- New quality tools and systems
- Lessons learned from deviations

### Competency Assessment

**Demonstration Methods**:
- Written tests (>80% passing score)
- Hands-on demonstration
- Observation by qualified trainer
- Periodic re-assessment

**Training Records**:
- Training topic and date
- Trainer and trainee names
- Assessment results
- Next training due date

## Continuous Improvement

### Quality Improvement Tools

**Pareto Analysis**:
- 80/20 rule (80% problems from 20% causes)
- Focus on vital few defects
- Bar chart with cumulative line
- Guide resource allocation

**Control Plans**:
- Product/process characteristics
- Measurement methods and frequency
- Control methods
- Reaction plans for out-of-control

**Mistake-Proofing (Poka-Yoke)**:
- Prevention: Make error impossible
- Detection: Alert immediately when error occurs
- Examples: Color coding, sensors, fixtures

### Quality Circles and Kaizen

**Quality Circles**:
- Small groups (5-10 people)
- Meet regularly (weekly/monthly)
- Identify and solve quality problems
- Implement and track improvements

**Kaizen Events**:
- Focused improvement (3-5 days)
- Cross-functional team
- Rapid implementation
- Measurable results

## Integration with Other Agents

### Production Scheduling
- Schedule inspection operations
- Include hold times for test results
- Buffer time for potential rework
- Coordinate with quality resources

### Shop Floor
- Real-time quality alerts
- SPC chart monitoring
- Immediate containment support
- Operator training reinforcement

### Predictive Maintenance
- Equipment calibration schedules
- Measurement system reliability
- Preventive maintenance for test equipment

## Last Updated: November 2025`
  },

  // Demand Management Agent
  {
    title: "Demand Forecasting and Management",
    description: "Demand forecasting methodologies, trend analysis techniques, and market intelligence for accurate production planning",
    agentId: "demand_management",
    category: "planning",
    tags: ["demand-forecasting", "trends", "market-intelligence", "statistical-forecasting"],
    content: `# Demand Forecasting and Management

## Overview
This playbook covers demand forecasting methods, trend analysis, market intelligence gathering, and forecast accuracy improvement for effective production planning.

## Forecasting Fundamentals

### Forecast Horizon
**Short-Term (0-3 months)**:
- Detailed by SKU and location
- Weekly or daily granularity
- High accuracy expected (>85%)
- Drives immediate production and inventory

**Medium-Term (3-12 months)**:
- Product family level acceptable
- Monthly granularity
- Moderate accuracy (70-85%)
- Supports capacity and material planning

**Long-Term (1-3 years)**:
- Strategic planning and capital investment
- Quarterly or annual
- Lower accuracy acceptable (60-75%)
- Guides facility and technology decisions

### Forecast Components
**Trend**: Long-term direction (increasing, decreasing, stable)
**Seasonality**: Regular patterns (monthly, quarterly, annual)
**Cyclical**: Business cycles (economic ups and downs)
**Random**: Unexplained variation (noise)

## Forecasting Methods

### Qualitative Methods

**Executive Opinion**:
- Senior management judgment
- Quick but potentially biased
- Useful for new products or markets
- Combine multiple opinions for balance

**Sales Force Composite**:
- Bottom-up from field sales input
- Close to customer but may be optimistic
- Detail by region and customer
- Aggregate and adjust for bias

**Market Research**:
- Customer surveys and focus groups
- External market studies
- Competitive intelligence
- New product demand estimation

**Delphi Method**:
- Structured expert consensus process
- Anonymous rounds with feedback
- Reduces bias and groupthink
- Time-consuming but thorough

### Quantitative Methods

**Moving Average**:
- Simple average of recent periods
- Smooths random variation
- Lags turning points
- Best for stable demand

**Weighted Moving Average**:
- More weight on recent periods
- More responsive than simple MA
- Still lags trends
- Good for gradual changes

**Exponential Smoothing**:
- Weighted average with decay
- Alpha (smoothing constant) 0-1
- Higher alpha = more responsive
- Low alpha = more smoothing

**Trend-Adjusted Exponential Smoothing (Holt's Method)**:
- Captures trend component
- Two smoothing constants (level and trend)
- Better for trending data
- Requires more history

**Seasonal Exponential Smoothing (Winters' Method)**:
- Handles trend and seasonality
- Three smoothing constants
- Multiplicative or additive seasonality
- Best for products with clear seasonal patterns

**Linear Regression**:
- Forecasts based on time or causal variables
- Y = a + bX (time) or Y = a + b1X1 + b2X2... (multiple regression)
- Quantifies relationships
- Useful for cause-and-effect analysis

**ARIMA (AutoRegressive Integrated Moving Average)**:
- Advanced time series method
- Combines AR (past values) and MA (past errors)
- Handles non-stationary data (differencing)
- Requires statistical expertise

**Machine Learning**:
- Neural networks, random forests, gradient boosting
- Captures complex patterns
- Requires large datasets
- "Black box" - harder to explain

## Forecast Accuracy Measurement

### Accuracy Metrics

**Mean Absolute Deviation (MAD)**:
- Formula: Σ|Actual - Forecast| / n
- Easy to understand
- Same units as data
- Doesn't penalize large errors extra

**Mean Absolute Percentage Error (MAPE)**:
- Formula: (Σ|Actual - Forecast| / Actual) / n × 100%
- Percentage - easy to compare products
- Doesn't work if actual = 0
- Standard: <10% excellent, <20% good, >50% poor

**Mean Squared Error (MSE)**:
- Formula: Σ(Actual - Forecast)² / n
- Penalizes large errors more
- Used in statistical models
- Hard to interpret (squared units)

**Tracking Signal**:
- Formula: Cumulative error / MAD
- Detects bias in forecasts
- Should stay within ±4
- Triggers forecast method review

### Improving Forecast Accuracy

**Clean Historical Data**:
- Remove outliers and one-time events
- Adjust for promotions and stockouts
- Fill missing data appropriately
- Consistent time periods

**Segment Products**:
- ABC analysis (high volume more important)
- Product lifecycle stage (intro, growth, mature, decline)
- Demand pattern (steady, trending, seasonal, intermittent)
- Different methods for different segments

**Collaborate Cross-Functionally**:
- Sales provides market intelligence
- Marketing shares promotion plans
- Finance contributes economic outlook
- Operations validates feasibility

**Monitor and Adjust**:
- Track accuracy metrics regularly
- Investigate large errors
- Update models and parameters
- Continuous improvement mindset

## Demand Pattern Recognition

### Steady Demand
**Characteristics**:
- Consistent volume over time
- Low coefficient of variation (CV < 0.3)
- Minimal seasonality or trend

**Best Methods**:
- Simple moving average
- Exponential smoothing (low alpha)

**Planning Implications**:
- Stable production schedules
- Lower safety stock requirements
- Efficient resource utilization

### Trending Demand
**Characteristics**:
- Consistent increase or decrease
- New products (growth phase)
- Declining products (phase-out)

**Best Methods**:
- Trend-adjusted exponential smoothing
- Linear regression on time

**Planning Implications**:
- Capacity expansion or reduction
- Adjust inventory targets over time
- Product lifecycle management

### Seasonal Demand
**Characteristics**:
- Regular patterns (weekly, monthly, yearly)
- Examples: holidays, weather, school year

**Best Methods**:
- Seasonal exponential smoothing
- Seasonal decomposition
- Seasonal indices

**Planning Implications**:
- Build inventory ahead of peak
- Flexible capacity (overtime, temps)
- Coordinate with supply chain

### Intermittent Demand
**Characteristics**:
- Sporadic orders with zero demand periods
- Spare parts, slow-moving items
- Difficult to forecast

**Best Methods**:
- Croston's method
- Bootstrapping
- Service level-based reorder points

**Planning Implications**:
- Make-to-order strategy
- Higher safety stock as percentage
- Supplier agreements for quick response

## Market Intelligence

### Data Sources

**Internal Data**:
- Historical sales and bookings
- Customer complaints and feedback
- Sales pipeline and quotes
- Warranty claims and returns

**External Data**:
- Industry reports and market research
- Economic indicators (GDP, PMI, housing starts)
- Competitor actions (pricing, new products)
- Regulatory and technology changes

**Leading Indicators**:
- Web traffic and search trends
- Social media sentiment
- Distributor inventory levels
- Commodity prices and currency rates

### Collaborative Planning, Forecasting, and Replenishment (CPFR)

**Partners Share**:
- Point-of-sale (POS) data
- Inventory levels
- Promotion plans
- New product introductions

**Joint Business Planning**:
- Aligned strategies and objectives
- Shared forecasts
- Exception-based management
- Performance reviews

**Benefits**:
- Reduced forecast error
- Lower inventory across supply chain
- Fewer stockouts and markdowns
- Stronger partnerships

## Demand Shaping

### Pricing and Promotions
**Price Elasticity**:
- Elastic demand (>1): Price sensitive
- Inelastic demand (<1): Price insensitive
- Use for pricing strategy and promotion forecasting

**Promotion Planning**:
- Historical lift from similar promotions
- Seasonality and timing effects
- Cannibalization of regular sales
- Competitive responses

### New Product Forecasting
**Analog Methods**:
- Compare to similar product launches
- Adjust for differences (features, price, market)
- Bass diffusion model for adoption curve

**Market Research**:
- Concept testing and intent to purchase
- Adjust for stated vs. actual behavior (typically 20-50% conversion)
- Test markets and pilot launches

**Scenario Planning**:
- Best case, most likely, worst case
- Probability-weighted forecasts
- Prepare for uncertainty

## Consensus Forecasting Process

### Monthly Forecast Cycle

**Week 1: Statistical Forecast**:
- Generate baseline using historical data and algorithms
- Segment by product family and region
- Calculate accuracy metrics from prior period

**Week 2: Commercial Input**:
- Sales and marketing review and adjust
- Add intelligence on customers, competition, market
- Document assumptions and rationale

**Week 3: Operations Review**:
- Supply chain validates feasibility
- Capacity constraints and material availability
- Alternative scenarios if needed

**Week 4: Executive Approval**:
- Cross-functional meeting (S&OP)
- Resolve conflicts and finalize
- Approve financial plan
- Communicate to organization

### Forecast Value Add (FVA)
**Concept**: Measure whether manual adjustments improve or worsen forecast accuracy

**Analysis**:
- Compare statistical forecast accuracy to final forecast accuracy
- Identify who/what adds value vs. introduces bias
- Focus improvements where value is added
- Eliminate or automate non-value-added adjustments

## Integration with Planning

### Sales & Operations Planning (S&OP)

**Demand Review**:
- Analyze forecast vs. actual performance
- Review market trends and intelligence
- Update demand forecast by product family
- Identify risks and opportunities

**Supply Review**:
- Match supply plan to demand
- Identify capacity gaps or excess
- Inventory and backlog targets
- Supply chain risks and mitigation

**Financial Reconciliation**:
- Align volume plan with budget and targets
- Revenue and margin implications
- Working capital requirements
- Investment decisions

### Master Production Schedule (MPS)

**From Demand Forecast to MPS**:
1. Aggregate forecast by product family
2. Disaggregate to SKU level using mix percentages
3. Add/subtract to meet inventory targets
4. Constrain by capacity and material
5. Freeze immediate horizon, flexible further out

**Planning Parameters**:
- Demand time fence (DTF): No major changes allowed
- Planning time fence (PTF): Changes require approval
- Safety stock and reorder points
- Lot sizing rules (min/max, multiples)

## Advanced Topics

### Demand Sensing
**Real-Time Data**:
- Point-of-sale (POS) from retailers
- Distribution center withdrawals
- Website traffic and conversions
- Social media signals

**Short-Term Forecast Update**:
- Detect changes weeks earlier than monthly cycle
- Adjust production and allocation quickly
- Reduce forecast error by 20-40% in short term

### Machine Learning Applications
**Big Data Sources**:
- IoT sensors and connected products
- Social media and web analytics
- Weather and event calendars
- Economic and geopolitical data

**Advanced Algorithms**:
- Deep learning for pattern recognition
- Ensemble methods combining multiple models
- Reinforcement learning for continuous improvement
- Explainable AI for transparency

**Implementation**:
- Start with high-volume, high-impact products
- Require significant historical data (years)
- Maintain statistical models as backup
- Monitor and retrain models regularly

## Best Practices

### Forecast Ownership
- Clear accountability for each product/region
- Authority to make adjustments with rationale
- Performance measured and recognized
- Training and tools provided

### Documentation
- Assumptions clearly stated
- Data sources and methods documented
- Approval and review history maintained
- Lessons learned captured

### Communication
- Regular cadence (weekly/monthly)
- Standardized reports and dashboards
- Exception management (focus on large changes)
- Transparency builds trust

## Integration with Other Agents

### Production Scheduling
- Demand forecast drives production planning
- Coordinate on feasibility and timing
- Balance level production vs. chase demand

### Supply Planning
- Forecast drives material requirements
- Supplier communication and commitments
- Long lead time items require early signals

### Inventory Planning
- Safety stock levels based on forecast error
- Inventory targets by service level
- ABC segmentation for differentiated strategies

## Last Updated: November 2025`
  },

  // Supply Planning Agent
  {
    title: "Supply Planning and Procurement Strategies",
    description: "Production planning, procurement optimization, supplier management, and subcontract coordination for reliable supply",
    agentId: "supply_plan",
    category: "planning",
    tags: ["supply-planning", "procurement", "mrp", "suppliers", "make-vs-buy"],
    content: `# Supply Planning and Procurement Strategies

## Overview
This playbook covers supply planning methodologies, procurement optimization, supplier relationship management, and effective coordination of make-vs-buy decisions to ensure reliable material supply.

## Material Requirements Planning (MRP)

### MRP Logic
**Inputs**:
1. **Master Production Schedule (MPS)**: What to make and when
2. **Bill of Materials (BOM)**: What materials are needed
3. **Inventory Records**: What we have on hand and on order
4. **Lead Times**: How long to procure or manufacture

**Process**:
1. **Gross Requirements**: Explode MPS through BOM
2. **Net Requirements**: Subtract on-hand and on-order inventory
3. **Planned Orders**: Calculate order quantities and dates
4. **Time Phasing**: Schedule based on lead times

**Outputs**:
- Purchase requisitions for procurement
- Production orders for manufactured items
- Rescheduling messages for existing orders
- Exception reports for planning action

### Planning Parameters

**Lead Times**:
- Purchase lead time (PO to receipt)
- Manufacturing lead time (order to completion)
- Safety lead time (buffer for variability)
- Cumulative lead times for deep BOMs

**Lot Sizing Rules**:
- **Lot-for-Lot (L4L)**: Order exact net requirement
  - Minimizes inventory but many orders
  - Best for expensive items or JIT
- **Fixed Order Quantity (FOQ)**: Order standard amount
  - Simplifies ordering and production
  - May build excess inventory
- **Economic Order Quantity (EOQ)**: Balance order cost vs. carrying cost
  - Formula: √(2DS/H) where D=demand, S=setup cost, H=holding cost
- **Period Order Quantity (POQ)**: Cover fixed time period
  - Example: 2-week supply, 1-month supply

**Safety Stock**:
- Buffer against demand variability
- Buffer against supply variability (lead time, quality)
- Formula: Z × σ × √LT
  - Z = service level factor
  - σ = standard deviation of demand
  - LT = lead time in periods

### MRP II (Manufacturing Resource Planning)
**Closed-Loop MRP**:
- Add capacity requirements planning (CRP)
- Check feasibility of material plan against capacity
- Feedback actual production and consumption
- Continuous plan adjustment

**Financial Integration**:
- Inventory valuation and forecasting
- Purchase commitments and cash flow
- Cost roll-ups through BOM
- Budget vs. actual analysis

## Procurement Strategies

### Strategic Sourcing

**Supplier Selection Criteria**:
1. **Quality**: Capability, certifications, defect rates
2. **Cost**: Unit price, total cost of ownership (TCO)
3. **Delivery**: Lead time, on-time performance, flexibility
4. **Capacity**: Volume capability, scalability
5. **Technology**: Innovation, IP, proprietary processes
6. **Risk**: Financial health, geographic, single-source

**Sourcing Options**:
- **Single Source**: One supplier for simplicity and leverage
  - Risk: Dependency, supply disruption
- **Dual Source**: Primary and backup supplier
  - Balance: Reliability with some competition
- **Multiple Sources**: Three or more suppliers
  - Advantage: Competition, flexibility
  - Challenge: Complexity, lower volume per supplier

**Total Cost of Ownership (TCO)**:
\`\`\`
TCO = Purchase Price
    + Transportation
    + Receiving and inspection
    + Inventory carrying cost
    + Quality costs (rejects, rework)
    + Administrative costs
    + Risk costs (disruption, obsolescence)
\`\`\`

### Purchasing Tactics

**Request for Quote (RFQ)**:
- Detailed specifications
- Volume and timing requirements
- Quality and delivery expectations
- Terms and conditions
- Award based on total value, not just price

**Negotiation Strategies**:
- **Volume Discounts**: Commit to quantities for lower price
- **Long-Term Agreements**: 1-3 year contracts for stability
- **Annual Price Reductions**: Continuous improvement sharing
- **Index-Based Pricing**: Tie to commodity indices
- **Risk Sharing**: Share upside/downside of market changes

**E-Procurement**:
- Online catalogs and punch-outs
- Automated PO generation
- Electronic invoicing and payment
- Spend analysis and compliance
- Reduced transaction costs

### Make vs. Buy Decisions

**Make (In-House Manufacturing)**:
Advantages:
- Control over quality and lead time
- Protect proprietary technology
- Utilize existing capacity
- Lower unit cost at high volume

Disadvantages:
- Capital investment required
- Fixed costs and breakeven risk
- Capacity constraints
- Focus away from core competencies

**Buy (Outsource/Subcontract)**:
Advantages:
- Variable cost (pay per unit)
- Access to supplier expertise and technology
- Scalability and flexibility
- Focus on core business

Disadvantages:
- Less control over quality and timing
- Potential IP risks
- Supplier dependency
- Higher unit cost at low volume

**Break-Even Analysis**:
\`\`\`
Break-Even Volume = Fixed Cost Difference / (Variable Cost Buy - Variable Cost Make)

If expected volume > break-even: Make
If expected volume < break-even: Buy
\`\`\`

**Strategic Considerations**:
- Core vs. non-core activities
- Long-term demand outlook
- Competitive advantage
- Risk and flexibility needs

## Supplier Relationship Management

### Supplier Segmentation

**Strategic Suppliers**:
- Critical to business success
- High spend or strategic materials
- Partnership approach
- Joint business planning and innovation

**Preferred Suppliers**:
- Reliable and good performance
- Moderate spend and importance
- Collaborative relationship
- Regular business reviews

**Transactional Suppliers**:
- Low-risk commodities
- Low spend
- Arm's-length relationship
- Focus on efficiency and cost

### Supplier Performance Metrics

**Quality Metrics**:
- Incoming defect rate (ppm)
- Lot acceptance rate
- Certificate of Analysis (COA) accuracy
- Corrective action responsiveness

**Delivery Metrics**:
- On-time delivery (OTD) percentage
  - Target: >95%
- Lead time consistency (standard deviation)
- Fill rate (complete orders / total orders)
- Emergency responsiveness

**Cost Metrics**:
- Price competitiveness vs. market
- Annual cost reductions achieved
- Total cost of ownership
- Payment terms and discounts

**Service Metrics**:
- Order accuracy and completeness
- Technical support responsiveness
- Flexibility for changes
- Communication and collaboration

### Supplier Development

**Capability Building**:
- Quality system training (ISO, GMP)
- Lean manufacturing workshops
- Technology transfer and co-development
- Equipment and tooling investments

**Performance Improvement**:
- Joint problem-solving teams
- Root cause analysis and CAPA
- Process audits and corrective actions
- Benchmarking and best practice sharing

**Continuous Monitoring**:
- Scorecards (monthly/quarterly)
- Business reviews (semi-annual/annual)
- Escalation for performance issues
- Recognition for excellence

## Subcontract Management

### Subcontract Planning

**Work Scope Definition**:
- Clear specifications and drawings
- Quality requirements and inspection criteria
- Materials provided vs. subcontractor-supplied
- Packaging, labeling, and shipping instructions

**Capacity Planning**:
- Subcontractor lead time and capacity limits
- Schedule coordination with internal operations
- Load balancing across multiple subcontractors
- Backup capacity arrangements

**Material Flow**:
- **Consignment**: Send materials to subcontractor
  - Ownership retained until use
  - Track via consignment inventory
- **Free-Issue**: Transfer material ownership
  - Subcontractor responsible for inventory
- **Subcontractor-Supplied**: Subcontractor procures
  - Simplest but less control

### Subcontract Execution

**Purchase Order Management**:
- Clear PO with all requirements
- Acknowledgment and confirmation
- Schedule releases for blanket orders
- Change orders for modifications

**In-Process Monitoring**:
- Regular status updates
- Milestone tracking and payment triggers
- Quality inspections during process
- Material usage tracking

**Receipt and Verification**:
- Inspection per approved plan
- Certificate of conformance (COC)
- Traceability documentation
- Inventory receipt and accounting

### Quality Assurance for Subcontractors

**Supplier Quality Agreements (SQA)**:
- Define quality expectations
- Inspection and testing requirements
- Non-conformance handling
- Right to audit

**Audits**:
- Pre-qualification audits
- Annual surveillance audits
- For-cause audits (quality issues)
- Corrective action follow-up

**Incoming Inspection**:
- Sample size per AQL or inspection plan
- Reduced inspection for proven performers
- Skip lot for excellent quality history
- 100% inspection for critical items or new suppliers

## Risk Management

### Supply Chain Risks

**Supplier Risks**:
- Financial instability or bankruptcy
- Capacity constraints
- Quality problems
- Labor disputes

**Geographic Risks**:
- Natural disasters (earthquake, flood, hurricane)
- Political instability or trade restrictions
- Transportation disruptions
- Regional health crises

**Market Risks**:
- Commodity price volatility
- Currency exchange fluctuations
- Demand-supply imbalances
- Technological obsolescence

### Risk Mitigation Strategies

**Diversification**:
- Multiple suppliers (avoid single source)
- Geographic diversity (different regions)
- Backup suppliers pre-qualified
- Buffer inventory for critical items

**Supplier Monitoring**:
- Financial health reviews (quarterly)
- Capacity utilization tracking
- Performance trend analysis
- Early warning systems

**Contractual Protections**:
- Force majeure clauses
- Price protection (caps, collars)
- Termination rights
- Liability and insurance requirements

**Business Continuity Planning**:
- Identify critical suppliers and materials
- Document alternative sources
- Emergency contact procedures
- Disaster recovery and communication plan

## Inventory Optimization

### Inventory Types

**Raw Materials**:
- Purchased components and materials
- Driven by demand forecast and MRP
- Balance against supplier lead times
- ABC analysis for differentiated management

**Work-in-Process (WIP)**:
- Material between operations
- Driven by production batch sizes and cycle times
- Theory of Constraints: Buffer before bottleneck
- Lean manufacturing: Minimize WIP

**Finished Goods**:
- Completed products ready for sale
- Driven by demand variability and service level
- Make-to-stock vs. make-to-order strategy
- Distribution network placement

**Safety Stock**:
- Buffer against uncertainty
- Demand variability and supply variability
- Higher for critical items and poor forecasts
- Review and adjust periodically

### ABC Analysis

**Classification**:
- **A Items** (20% of SKUs, 80% of value):
  - High priority, tight control
  - Lower safety stock (%), frequent review
  - Focus on forecast accuracy and supplier relationships
- **B Items** (30% of SKUs, 15% of value):
  - Moderate control and review
  - Standard policies
- **C Items** (50% of SKUs, 5% of value):
  - Simple rules, less attention
  - Higher safety stock (%), infrequent review
  - Consider vendor-managed inventory (VMI)

**XYZ Analysis** (Variability):
- **X**: Stable demand, low variability
- **Y**: Moderate variability
- **Z**: Erratic demand, high variability
- Combine with ABC for nuanced strategies:
  - AX: Critical and predictable → Low safety stock, optimize
  - AZ: Critical and erratic → Higher safety stock, close monitoring
  - CX: Low value and predictable → Simple reorder point
  - CZ: Low value and erratic → Generous stock or make-to-order

### Inventory Replenishment Models

**Continuous Review (Q Model)**:
- Monitor inventory continuously
- Order fixed quantity (Q) when hits reorder point (R)
- **Reorder Point**: R = Demand during lead time + Safety stock
- **Order Quantity**: Often EOQ
- Best for high-value or fast-moving items

**Periodic Review (P Model)**:
- Review at fixed intervals (weekly, monthly)
- Order variable quantity to reach target level (T)
- **Order Quantity**: T - Inventory position
- **Target Level**: Demand during lead time + review period + Safety stock
- Best for low-value items or grouped orders (same supplier)

**Min-Max System**:
- Simple variant of periodic review
- Order when below minimum to restore maximum
- Common in manufacturing and healthcare

## Collaborative Planning

### Supplier Partnerships

**Information Sharing**:
- Share forecasts and plans (with lead time to react)
- Production schedules and changes
- Inventory levels (supplier visibility)
- New product introductions and changes

**Joint Planning**:
- Capacity planning and reservations
- Material planning and releases
- Cost reduction initiatives
- Quality improvement projects

**Performance Incentives**:
- Volume commitments for pricing
- Performance bonuses (quality, delivery)
- Gain-sharing agreements
- Long-term relationship security

### Vendor-Managed Inventory (VMI)

**Concept**:
- Supplier monitors customer inventory
- Supplier responsible for replenishment
- Customer provides usage and forecast data

**Benefits**:
- Reduced stockouts and emergency orders
- Lower inventory (supplier can optimize)
- Reduced transaction costs
- Better supplier planning and efficiency

**Implementation**:
- Select appropriate suppliers and items
- Define service levels and parameters
- Provide data access (VMI portal or EDI)
- Monitor performance and adjust

## Best Practices

### Planning Excellence

**Data Integrity**:
- Accurate BOMs and routing
- Correct lead times and lot sizes
- Current inventory records (cycle counting)
- Reliable demand forecasts

**Integrated Planning**:
- Align demand and supply plans
- Cross-functional S&OP process
- Scenario planning for uncertainty
- Financial reconciliation

**Continuous Improvement**:
- Track KPIs (inventory turns, OTIF, forecast accuracy)
- Root cause analysis of misses
- Regular parameter review and tuning
- Technology and process upgrades

### Procurement Excellence

**Strategic Relationships**:
- Supplier segmentation and strategies
- Partnership approach for critical suppliers
- Fair and ethical dealings
- Long-term perspective

**Process Efficiency**:
- Automate transactional purchasing
- Reduce non-value-added activities
- Standardize and simplify
- Measure and improve cycle times

**Risk Management**:
- Identify and assess supply chain risks
- Develop mitigation plans
- Monitor and respond to early warnings
- Build resilience and flexibility

## Integration with Other Agents

### Demand Management
- Receive demand forecasts
- Collaborate on new products and changes
- Feedback on forecast accuracy and issues

### Production Scheduling
- Coordinate material supply with production schedule
- Material availability constraints
- Work-in-process inventory targets

### Inventory Planning
- Align safety stock and inventory targets
- Coordinate on ABC segmentation
- Joint optimization of inventory and supply

## Last Updated: November 2025`
  },

  // Inventory Planning Agent
  {
    title: "Inventory Optimization and Management",
    description: "Stock optimization strategies, inventory management best practices, ABC analysis, and supply-demand coordination",
    agentId: "inventory_planning",
    category: "planning",
    tags: ["inventory-optimization", "stock-management", "ABC-analysis", "safety-stock", "inventory-turns"],
    content: `# Inventory Optimization and Management

## Overview
This playbook provides comprehensive guidance on inventory optimization, stock management, ABC analysis, and coordinating inventory strategy with supply and demand planning.

## Inventory Management Fundamentals

### Purpose of Inventory

**Customer Service**:
- Ensure product availability (service level)
- Quick response to demand
- Competitive advantage

**Operational Efficiency**:
- Decouple operations (WIP buffers)
- Enable economic production quantities
- Smooth production despite demand variability

**Cost Management**:
- Take advantage of quantity discounts
- Hedge against price increases
- Buffer against supply disruptions

**Strategic Objectives**:
- Support growth and new products
- Seasonal stock build
- Market positioning (premium availability)

### Inventory Costs

**Holding (Carrying) Costs**:
- Cost of capital (opportunity cost) - typically 10-15%
- Storage costs (warehouse, handling) - 2-5%
- Insurance and taxes - 1-3%
- Obsolescence and shrinkage - 2-5%
- **Total**: 15-30% of inventory value per year

**Ordering (Setup) Costs**:
- Purchase order processing
- Transportation and receiving
- Manufacturing setup time and materials
- Quality inspection

**Stockout Costs**:
- Lost sales and margin
- Customer dissatisfaction and potential loss
- Expediting costs (premium freight, overtime)
- Production disruptions

**Target**: Minimize total inventory cost = Holding + Ordering + Stockout costs

## Inventory Optimization Models

### Economic Order Quantity (EOQ)

**Classic EOQ Formula**:
\`\`\`
EOQ = √(2DS/H)

Where:
D = Annual demand (units)
S = Ordering/setup cost per order
H = Annual holding cost per unit
\`\`\`

**Example**:
- Demand = 10,000 units/year
- Ordering cost = $100/order
- Holding cost = $5/unit/year

EOQ = √(2 × 10,000 × 100 / 5) = √400,000 = 632 units

**Total Cost**:
\`\`\`
Total Cost = (D/Q)S + (Q/2)H + PD

Where Q = Order quantity, P = Unit price
\`\`\`

**Reorder Point (ROP)**:
\`\`\`
ROP = Demand during lead time + Safety stock
    = (Average daily demand × Lead time days) + Safety stock
\`\`\`

### Production Order Quantity (POQ)

**For Manufactured Items**:
\`\`\`
POQ = √(2DS/H(1-d/p))

Where:
d = Demand rate (units/day)
p = Production rate (units/day)
\`\`\`

**Distinction from EOQ**:
- Production and consumption occur simultaneously
- Average inventory = Q/2 × (1 - d/p)
- Applicable when making items in batches

### Quantity Discounts

**All-Units Discount**:
- Discount applies to entire order quantity
- May be optimal to order beyond EOQ to get discount

**Incremental Discount**:
- Discount applies only to units above breakpoint
- Less common, simpler analysis

**Analysis**:
1. Calculate EOQ ignoring discounts
2. If EOQ is feasible (above minimum for best price), done
3. Otherwise, calculate total cost at each price breakpoint
4. Select quantity with lowest total cost

## Safety Stock Calculation

### Basic Safety Stock Formula

**For Demand Variability**:
\`\`\`
Safety Stock = Z × σD × √LT

Where:
Z = Service level factor (from normal distribution)
σD = Standard deviation of demand per period
LT = Lead time in periods
\`\`\`

**Service Level Factors (Z)**:
- 90% service level: Z = 1.28
- 95% service level: Z = 1.65
- 98% service level: Z = 2.05
- 99% service level: Z = 2.33
- 99.9% service level: Z = 3.09

**For Lead Time Variability**:
\`\`\`
Safety Stock = Z × Average Demand × σLT

Where:
σLT = Standard deviation of lead time
\`\`\`

**For Both Demand and Lead Time Variability**:
\`\`\`
Safety Stock = Z × √((Average LT × σD²) + (Average Demand² × σLT²))
\`\`\`

### Service Level vs. Fill Rate

**Cycle Service Level (CSL)**:
- Probability of not stocking out during lead time
- Percentage of reorder cycles without stockout
- Simpler to calculate and manage

**Fill Rate (FR)**:
- Percentage of demand filled from stock
- Accounts for magnitude of shortages
- Better customer-facing metric
- More complex calculation (requires loss function)

**Relationship**:
- High CSL doesn't guarantee high fill rate
- Example: CSL = 95% might yield FR = 98%+
- For critical items, set fill rate target directly

## ABC Analysis and Segmentation

### ABC Classification

**Criteria**:
- **A Items**: 20% of SKUs, 80% of annual dollar usage
- **B Items**: 30% of SKUs, 15% of annual dollar usage
- **C Items**: 50% of SKUs, 5% of annual dollar usage

**Dollar Usage = Annual demand × Unit cost**

**Management Approach**:

**A Items**:
- Frequent review (weekly or daily)
- Tight control and accuracy
- Lower safety stock percentages
- Detailed demand forecasting
- Close supplier relationships
- Consider VMI or JIT

**B Items**:
- Moderate review frequency (bi-weekly or monthly)
- Standard policies
- Medium safety stock
- Standard forecasting methods

**C Items**:
- Infrequent review (monthly or quarterly)
- Simple rules (min/max, two-bin)
- Higher safety stock percentages (insurance)
- Simple forecasting or base stock
- Consider bulk purchases or eliminate slow movers

### XYZ Analysis (Demand Variability)

**Classification**:
- **X Items**: CV < 0.5 (stable, predictable)
- **Y Items**: 0.5 ≤ CV < 1.0 (moderate variability)
- **Z Items**: CV ≥ 1.0 (erratic, unpredictable)

**Coefficient of Variation (CV)**:
\`\`\`
CV = Standard Deviation / Mean Demand
\`\`\`

**Combined ABC-XYZ Matrix**:

| Class | AX | AY | AZ |
|-------|-----|-----|-----|
| Strategy | Optimize, Low SS | Monitor closely, Medium SS | High SS, Close watch |

| Class | BX | BY | BZ |
|-------|-----|-----|-----|
| Strategy | Standard policy | Standard policy | Higher SS |

| Class | CX | CY | CZ |
|-------|-----|-----|-----|
| Strategy | Simple rules, Generous SS | Simple rules, Higher SS | MTO or generous SS |

### FSN Analysis (Fast/Slow/Non-Moving)

**Classification**:
- **Fast Moving**: Consumed regularly and quickly
- **Slow Moving**: Consumed infrequently or slowly
- **Non-Moving**: No consumption in past 6-12 months

**Actions**:
- Fast: Maintain readily available, optimize replenishment
- Slow: Reduce stock, consider make-to-order
- Non-Moving: Disposition (use, scrap, sell), don't restock

## Inventory Policies by Product Type

### Make-to-Stock (MTS)

**Characteristics**:
- Standard products with predictable demand
- Customer expects immediate availability
- Examples: Consumer goods, commodities

**Strategy**:
- Carry finished goods inventory
- Higher service levels (>95%)
- Focus on forecast accuracy
- Optimize safety stock and reorder points

### Make-to-Order (MTO)

**Characteristics**:
- Customized or low-volume products
- Customer accepts lead time
- Examples: Custom equipment, engineer-to-order

**Strategy**:
- Minimal or no finished goods inventory
- May carry component inventory for fast response
- Emphasize flexible capacity and short lead times
- Order fulfillment performance > service level

### Assemble-to-Order (ATO)

**Characteristics**:
- Modular design with common components
- Late-stage differentiation
- Examples: Computers, automobiles (options)

**Strategy**:
- Carry inventory of components/modules
- Assemble quickly upon order
- Balance between MTS and MTO
- Optimize component inventory and assembly capacity

### Engineer-to-Order (ETO)

**Characteristics**:
- Unique design for each customer
- Long lead times
- Examples: Large capital equipment, construction

**Strategy**:
- No inventory of finished goods or major components
- May stock common fasteners and materials
- Project management focus
- Supplier partnerships for custom components

## Inventory Performance Metrics

### Inventory Turnover

**Formula**:
\`\`\`
Inventory Turns = Cost of Goods Sold (COGS) / Average Inventory Value

or

Inventory Turns = Annual Demand (units) / Average Inventory (units)
\`\`\`

**Interpretation**:
- Higher turns = Less inventory, faster flow
- Lower turns = More inventory, slower flow
- Industry benchmarks vary widely:
  - Retail grocery: 10-15 turns
  - Automotive: 8-12 turns
  - Aerospace: 2-4 turns

**Days of Inventory**:
\`\`\`
Days of Inventory = 365 / Inventory Turns
\`\`\`

### Service Level Metrics

**In-Stock Percentage**:
- (Days with stock / Total days) × 100%
- Simple but doesn't account for demand quantity

**Fill Rate**:
- (Units shipped from stock / Total units demanded) × 100%
- Best measure of customer service
- Target: 95-99% depending on item importance

**Order Fill Rate**:
- (Orders completely filled / Total orders) × 100%
- Strictest measure (partial fill = failure)

**Backorder Level**:
- Units on backorder / Average demand per day
- Days of demand on backorder
- Lower is better, target: <5 days

### Inventory Health Metrics

**Excess and Obsolete (E&O)**:
- **Excess**: Inventory beyond reasonable need (>12-24 months)
- **Obsolete**: No future demand expected
- Track $ value and % of total inventory
- Target: <5% of total inventory

**Dead Stock**:
- No movement in past 6-12 months
- Write-down or disposition
- Root cause: Forecast error, product change, over-buy

**Inventory Accuracy**:
- (Items with correct quantity / Total items counted) × 100%
- Measured by cycle counting
- Target: >95% overall, >99% for A items

## Inventory Control Techniques

### Cycle Counting

**Purpose**:
- Maintain inventory record accuracy
- Alternative to annual physical inventory
- Identify and correct issues continuously

**ABC Cycle Count Frequency**:
- A Items: Count weekly or monthly (12-52 times/year)
- B Items: Count quarterly or bi-monthly (4-6 times/year)
- C Items: Count semi-annually or annually (1-2 times/year)

**Process**:
1. Generate count list by schedule or trigger
2. Count physical inventory without looking at system
3. Compare count to system record
4. Investigate and resolve discrepancies
5. Adjust inventory record after approval
6. Analyze root cause and correct

**Triggers**:
- Zero balance in system
- Negative balance (error indicator)
- Transaction errors suspected
- Before/after large receipts or shipments

### Min-Max Inventory System

**Simple Two-Bin Equivalent**:
- **Min (Reorder Point)**: When to order
  - Typically: Demand during lead time + Safety stock
- **Max (Order-Up-To Level)**: How much to have
  - Typically: Min + EOQ or review period demand

**Operation**:
- When inventory ≤ Min, order to restore Max
- Order Quantity = Max - Inventory position

**Advantages**:
- Simple to understand and implement
- Visual management (two-bin, kanban)
- Works well for C items

### Consignment Inventory

**Concept**:
- Supplier owns inventory at customer location
- Customer pays when consumed/used
- Supplier replenishes regularly

**Benefits**:
- Reduced inventory investment for customer
- Improved availability and service
- Supplier has better visibility for planning

**Considerations**:
- Requires trust and strong relationship
- Supplier assumes inventory risk
- Need accurate consumption tracking
- Typically higher unit price to offset supplier cost

### Vendor-Managed Inventory (VMI)

**Concept**:
- Supplier monitors customer inventory and manages replenishment
- Customer provides demand/usage data
- Supplier owns inventory until used (often)

**Benefits**:
- Reduced stockouts and inventory levels
- Lower transaction costs (no POs)
- Better supplier planning (visibility)
- Improved overall supply chain efficiency

**Implementation**:
- Select suitable suppliers and items (predictable, high volume)
- Define service levels and safety stock parameters
- Provide data access (EDI, portal)
- Monitor performance and adjust

## Demand-Driven Inventory Management

### Buffer Management (DDMRP)

**Strategic Buffers**:
- Place inventory buffers at strategic decoupling points
- Absorb variability and protect flow
- Size based on variability, lead time, and desired service

**Buffer Zones**:
1. **Red Zone**: Minimum stock, triggers urgent action
2. **Yellow Zone**: Normal replenishment range
3. **Green Zone**: Excess stock, may pause replenishment

**Dynamic Adjustment**:
- Adjust buffer sizes based on actual demand and variability
- Seasonal patterns and trends
- Planned events (promotions, shutdowns)
- More responsive than static safety stock

### Postponement Strategy

**Concept**:
- Delay product differentiation until closer to customer order
- Keep inventory in generic or modular form
- Customize late in process

**Benefits**:
- Reduced total inventory (aggregate generic vs. many finished)
- Improved forecast accuracy (less SKU proliferation)
- Flexibility to respond to actual demand mix

**Examples**:
- Vanilla box (configure computer after order)
- Paint mixing at store vs. factory
- Private labeling at distribution center

## Seasonal and Promotional Inventory

### Seasonal Stock Build

**Planning**:
- Forecast peak season demand
- Calculate capacity and level production plan
- Build inventory during off-season
- Balance inventory cost vs. overtime/subcontract cost

**Risks**:
- Forecast error (over/under stock)
- Obsolescence if demand doesn't materialize
- Holding costs
- Product changes during season

**Mitigation**:
- Conservative forecast, commit late
- Flexible capacity options
- Markdown or return policies
- Modular or postponable products

### Promotional Inventory

**Challenges**:
- Demand spike difficult to forecast
- Lead time may not allow build-ahead
- Risk of excess inventory if promotion underperforms

**Strategies**:
- Analyze historical lift from similar promotions
- Build contingency inventory for high-probability success
- Fast replenishment for runaway success
- Clear disposition plan for excess (markdown, return, next promotion)

## Multi-Echelon Inventory Optimization (MEIO)

### Concept
- Optimize inventory across entire supply chain network
- Consider dependencies between echelon levels
- Allocate safety stock where most effective

### Echelons
1. **Supplier**: Raw materials and components
2. **Manufacturing Plant**: WIP and finished goods
3. **Distribution Centers**: Regional stock
4. **Retail Stores**: Customer-facing inventory

### Optimization Principles
- **Centralization Effect**: Aggregate inventory at higher echelon (lower total)
- **Risk Pooling**: Combine demand variability reduces total safety stock
- **Postponement**: Hold inventory upstream in generic form

**Trade-offs**:
- Lower inventory vs. longer customer lead time
- Transportation cost (consolidated shipments)
- Local service level vs. system efficiency

## Technology and Systems

### Inventory Management Systems

**Features**:
- Real-time inventory visibility (on-hand, on-order, allocated)
- Automatic reorder point and EOQ calculation
- Cycle count management and accuracy tracking
- ABC analysis and exception reporting
- Multi-location and lot tracking

**Integration**:
- ERP system (finance, purchasing, production)
- Warehouse Management System (WMS) for transactions
- Demand planning for forecasts
- Supplier portals for VMI

### Advanced Analytics

**Machine Learning Applications**:
- Demand forecasting (more accurate, adaptive)
- Optimal reorder points and safety stock
- Anomaly detection (unusual patterns)
- Predictive stockout alerts

**Simulation and Optimization**:
- Multi-echelon inventory optimization
- Scenario analysis (what-if)
- Network design and placement
- Inventory allocation and deployment

## Best Practices

### Inventory Strategy
- Align with business strategy (cost leadership, service differentiation)
- Segment inventory and apply appropriate policies
- Balance cost, service, and risk
- Regular review and adjustment

### Process Discipline
- Accurate data (demand, lead times, inventory records)
- Cycle counting and inventory accuracy >95%
- Timely transactions (receipts, issues, adjustments)
- Root cause analysis of errors and improvements

### Collaboration
- Cross-functional alignment (sales, operations, finance)
- Supplier partnerships (VMI, consignment)
- Demand and supply synchronization
- Clear accountability and performance metrics

### Continuous Improvement
- Track KPIs (turns, service level, E&O, accuracy)
- Benchmark against industry and best practices
- Technology enablement and automation
- Training and skill development

## Integration with Other Agents

### Demand Management
- Receive demand forecasts and actual orders
- Provide inventory availability and constraints
- Collaborate on safety stock and service levels

### Supply Planning
- Coordinate replenishment plans
- Communicate inventory targets and priorities
- Joint optimization of inventory and procurement

### Production Scheduling
- Provide inventory availability for production planning
- Coordinate finished goods build plans
- Manage WIP inventory targets

## Last Updated: November 2025`
  },

  // Predictive Maintenance Agent
  {
    title: "Predictive Maintenance and Equipment Optimization",
    description: "Predictive maintenance strategies, equipment health monitoring, failure prediction, and maintenance optimization to prevent downtime",
    agentId: "predictive_maintenance",
    category: "operations",
    tags: ["predictive-maintenance", "equipment-health", "failure-prediction", "maintenance-optimization", "IoT"],
    content: `# Predictive Maintenance and Equipment Optimization

## Overview
This playbook covers predictive maintenance strategies, condition monitoring techniques, failure prediction models, and maintenance optimization to maximize equipment uptime and extend asset life.

## Maintenance Strategy Evolution

### Reactive Maintenance (Run-to-Failure)
**Approach**: Repair only when equipment fails

**When Appropriate**:
- Low-criticality equipment
- Failure consequences are minimal
- Repair cost < preventive maintenance cost
- Redundancy exists

**Disadvantages**:
- Unplanned downtime disrupts production
- Secondary damage from failures
- Emergency repairs more expensive
- No spare parts planning

### Preventive Maintenance (Time-Based)
**Approach**: Service equipment at fixed intervals (hours, cycles, calendar)

**When Appropriate**:
- Known wear patterns (lubricants, filters, belts)
- Regulatory or warranty requirements
- Equipment without condition monitoring

**Advantages**:
- Planned downtime (schedule around production)
- Reduced unexpected failures
- Extended equipment life

**Disadvantages**:
- Maintenance may be unnecessary (wasted resources)
- "Infant mortality" from unnecessary intervention
- Does not prevent sudden failures between intervals

### Predictive Maintenance (Condition-Based)
**Approach**: Monitor equipment condition, maintain when indicators show need

**When Appropriate**:
- Critical equipment with high failure impact
- Equipment with measurable degradation patterns
- Cost-effective sensors and monitoring available

**Advantages**:
- Maintain only when needed (optimal timing)
- Advance warning allows planning
- Detect issues before failure
- Optimize resource use (labor, parts)

**Requirements**:
- Condition monitoring technology
- Baseline and threshold data
- Analytical capability
- Integration with maintenance planning

### Prescriptive Maintenance (AI-Driven)
**Approach**: AI/ML predicts failures and prescribes optimal actions

**Capabilities**:
- Multi-parameter failure prediction
- Remaining useful life (RUL) estimation
- Maintenance action optimization
- Resource and spare parts optimization

**Advanced Features**:
- Integration with production schedule
- Cost-benefit optimization
- Continuous learning and improvement

## Condition Monitoring Techniques

### Vibration Analysis

**What It Detects**:
- Bearing wear and damage
- Imbalance (rotor, impeller)
- Misalignment (coupling, shaft)
- Looseness (mechanical, structural)
- Resonance problems

**Measurement**:
- Accelerometers on bearing housings
- Overall vibration level (velocity, acceleration)
- Frequency spectrum analysis (FFT)
- Time waveform analysis

**Thresholds (ISO 10816)**:
- **Green**: <2.5 mm/s RMS (good)
- **Yellow**: 2.5-7.1 mm/s (acceptable)
- **Orange**: 7.1-18 mm/s (unsatisfactory, plan maintenance)
- **Red**: >18 mm/s (unacceptable, stop immediately)

**Frequency Analysis**:
- **1× RPM**: Imbalance
- **2× RPM**: Misalignment
- **Ball Pass Frequencies**: Bearing defects
- **Gear Mesh Frequency**: Gear wear

### Thermography (Infrared)

**What It Detects**:
- Electrical hot spots (connections, switches)
- Bearing overheating
- Insulation breakdown
- Heat exchanger fouling
- Process anomalies

**Equipment**:
- Handheld IR cameras
- Fixed thermal imaging systems
- Non-contact temperature sensors

**Applications**:
- **Electrical Systems**: Hot connections, imbalanced loads
- **Mechanical Systems**: Overheated bearings, couplings
- **Process Equipment**: Furnaces, heat exchangers
- **Building**: Energy audits, moisture detection

**Best Practices**:
- Establish baseline temperatures
- Account for ambient and load conditions
- Regular routes and consistent methodology
- Trending over time

### Oil Analysis

**What It Detects**:
- Wear metals (iron, copper, aluminum, chromium)
- Contamination (dirt, water, fuel)
- Lubricant degradation (viscosity, acid number, oxidation)
- Additive depletion

**Tests**:
- **Spectrometric Analysis**: Elemental concentration (wear metals)
- **Viscosity**: Lubricant breakdown or contamination
- **Particle Count**: Contamination level (ISO cleanliness code)
- **Water Content**: Contamination (Karl Fischer)
- **Acid Number**: Oxidation and degradation
- **Ferrography**: Large wear particle examination

**Sampling**:
- Representative sample (running equipment, proper location)
- Consistent sampling procedure
- Regular intervals (oil changes, monthly, quarterly)
- Contamination-free containers

**Interpretation**:
- Compare to baseline and limits
- Trend analysis over time
- Sudden changes vs. gradual wear
- Correlate with other condition indicators

### Ultrasonic Testing

**What It Detects**:
- Compressed air/gas leaks
- Vacuum leaks
- Electrical corona and arcing
- Bearing lubrication needs
- Valve leaks (internal, external)

**Advantages**:
- Detect issues in noisy environments
- Find leaks saving energy
- Early bearing detection (before vibration)
- Non-contact, safe

**Applications**:
- **Air Systems**: Compressed air leak detection
- **Electrical**: High-voltage corona and tracking
- **Steam**: Trap testing and leak detection
- **Mechanical**: Bearing lubrication monitoring

### Motor Current Signature Analysis (MCSA)

**What It Detects**:
- Rotor bar defects
- Air gap eccentricity
- Bearing wear
- Load variations
- Electrical issues (imbalance, harmonics)

**Advantages**:
- Non-intrusive (measure at motor control center)
- Continuous monitoring possible
- Early detection of electrical and mechanical faults

**Analysis**:
- Current waveform and FFT
- Imbalance and phase differences
- Sideband frequencies indicate defects

## Failure Prediction Models

### Statistical Methods

**Weibull Analysis**:
- Model time-to-failure distributions
- Calculate failure rate, MTBF, reliability
- Identify failure modes (infant mortality, random, wear-out)

**Survival Analysis**:
- Estimate probability of survival over time
- Account for censored data (still running)
- Cox proportional hazards model

**Control Charts**:
- Track condition indicators over time
- Statistical process control for maintenance
- Out-of-control signals trigger action

### Machine Learning Models

**Supervised Learning**:
- **Classification**: Predict failure vs. no-failure (binary or multi-class)
  - Random Forest, Gradient Boosting, SVM, Neural Networks
- **Regression**: Predict remaining useful life (RUL)
  - Linear Regression, Random Forest, Neural Networks

**Unsupervised Learning**:
- **Anomaly Detection**: Identify unusual patterns indicating impending failure
  - Isolation Forest, One-Class SVM, Autoencoders
- **Clustering**: Group similar failure modes

**Deep Learning**:
- **LSTM (Long Short-Term Memory)**: Time series prediction
- **CNN (Convolutional Neural Networks)**: Image-based inspection
- **Autoencoders**: Anomaly detection from high-dimensional data

### Model Development Process

**1. Data Collection**:
- Historical failure data (dates, modes, conditions)
- Condition monitoring data (vibration, temperature, oil analysis)
- Operating conditions (load, speed, temperature, cycles)
- Maintenance records (actions, parts, downtime)

**2. Feature Engineering**:
- Extract relevant features from raw data
- Time-domain features (mean, max, RMS, kurtosis)
- Frequency-domain features (peak frequencies, harmonics)
- Trend features (rate of change, cumulative)

**3. Model Training**:
- Split data (training, validation, test)
- Select appropriate algorithm
- Hyperparameter tuning
- Cross-validation

**4. Model Evaluation**:
- Accuracy, precision, recall, F1-score
- ROC curve and AUC
- Confusion matrix (false positives vs. false negatives)
- Business metrics (cost, downtime prevented)

**5. Deployment and Monitoring**:
- Real-time or batch prediction
- Alert thresholds and escalation
- Model performance monitoring
- Retraining with new data

## Maintenance Optimization

### Reliability-Centered Maintenance (RCM)

**Process**:
1. **Identify Functions**: What the equipment is supposed to do
2. **Functional Failures**: How it can fail to perform
3. **Failure Modes**: Causes of functional failures
4. **Failure Effects**: Consequences of each failure mode
5. **Failure Management**: Select appropriate maintenance tasks

**Failure Consequences**:
- **Hidden Failures**: Not evident to operators (protective devices)
- **Safety/Environmental**: Risk to people or environment
- **Operational**: Production loss, quality impact
- **Non-Operational**: Repair cost only

**Maintenance Task Selection**:
- **Condition-Based**: If failure mode is detectable
- **Time-Based**: If wear-out pattern is predictable
- **Failure-Finding**: For hidden failures (test functionality)
- **Run-to-Failure**: If consequence is acceptable and no effective preventive task

### Total Productive Maintenance (TPM)

**Pillars**:
1. **Autonomous Maintenance**: Operators perform routine maintenance
2. **Planned Maintenance**: Scheduled preventive and predictive activities
3. **Quality Maintenance**: Eliminate quality defects at source
4. **Focused Improvement**: Cross-functional teams solve chronic problems
5. **Early Equipment Management**: Design for maintainability
6. **Training**: Skills development for operators and maintainers
7. **Safety, Health, Environment**: Zero accidents and environmental incidents
8. **TPM in Administration**: Extend to non-manufacturing areas

**Overall Equipment Effectiveness (OEE)**:
\`\`\`
OEE = Availability × Performance × Quality

Availability = Operating Time / Planned Production Time
Performance = (Actual Output / Ideal Output) × 100%
Quality = Good Units / Total Units Produced

World Class OEE = >85%
\`\`\`

**Six Big Losses**:
1. **Breakdown Losses**: Equipment failures (Availability)
2. **Setup and Adjustment**: Changeovers (Availability)
3. **Small Stops and Idling**: Minor stoppages <5 min (Performance)
4. **Reduced Speed**: Running below design speed (Performance)
5. **Startup Losses**: Scrap and rework during startup (Quality)
6. **Quality Defects**: Scrap and rework during production (Quality)

### Maintenance Planning and Scheduling

**Planning (What and How)**:
- **Work Scope**: Detailed description of tasks
- **Materials**: Parts, tools, consumables required
- **Resources**: Craft skills and labor hours
- **Procedures**: Step-by-step instructions, safety
- **Duration**: Estimated time to complete

**Scheduling (When)**:
- **Priority**: Criticality and urgency of work
- **Dependencies**: Prerequisite tasks, parts availability
- **Resources**: Available labor and skills
- **Coordination**: Production schedule, shutdowns
- **Duration**: Estimated time window required

**Best Practices**:
- **Weekly Schedule Compliance**: >90% target
- **Wrench Time**: 50%+ (time on tools vs. travel, wait, find)
- **Preventive/Predictive Ratio**: 80%+ planned, <20% reactive
- **Planning Horizon**: 4-6 weeks advance planning

### Spare Parts Management

**Criticality Analysis**:
- **Critical Spares**: Required immediately, long lead time
  - Stock sufficient quantity, multiple sources if possible
- **Insurance Spares**: Expensive, rare failure but catastrophic
  - Stock minimum quantity, evaluate consignment
- **Consumables**: Used regularly, readily available
  - Optimize based on usage rate and order costs

**Inventory Optimization**:
- **ABC Analysis**: Focus on high-value and critical items
- **Min-Max Levels**: Based on usage rate and lead time
- **Reorder Point**: Usage during lead time + safety stock
- **Obsolescence Management**: Dispose of unused parts, update for equipment changes

**Supplier Management**:
- **Strategic Partnerships**: Long-term agreements for critical parts
- **24/7 Emergency Support**: For downtime situations
- **Consignment Inventory**: Supplier-owned stock on-site
- **Vendor-Managed Inventory (VMI)**: Supplier monitors and replenishes

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Asset Inventory and Criticality**:
- List all production equipment
- Criticality ranking (production impact, failure frequency, cost)
- Select top 20% for initial predictive maintenance

**Baseline Data Collection**:
- Install sensors on critical equipment
- Establish baseline performance (vibration, temperature, etc.)
- Document current state and failure history

**Team Training**:
- Condition monitoring basics
- Data collection procedures
- Alert response protocols

### Phase 2: Analytics and Alerts (Months 4-8)

**Thresholds and Alerts**:
- Define alert levels (green/yellow/orange/red)
- Set up automated notifications
- Escalation procedures for critical alerts

**Data Visualization**:
- Real-time dashboards for monitoring
- Trend charts for condition indicators
- Exception reports for out-of-range

**Predictive Models (Basic)**:
- Simple regression or threshold-based
- Predict failures for high-priority equipment
- Generate maintenance work orders automatically

### Phase 3: Optimization (Months 9-12)

**Advanced Analytics**:
- Machine learning models for failure prediction
- Remaining useful life (RUL) estimation
- Optimize maintenance intervals based on condition

**Integration**:
- Link with production scheduling (plan maintenance during downtime)
- Integrate with CMMS for work order management
- Supplier integration for parts ordering

**Continuous Improvement**:
- Track KPIs (MTBF, MTTR, OEE, maintenance costs)
- Root cause analysis of failures
- Refine models and thresholds
- Expand to more equipment

## Key Performance Indicators (KPIs)

### Reliability Metrics

**Mean Time Between Failures (MTBF)**:
- Formula: Total Operating Time / Number of Failures
- Higher is better (more reliable)
- Track by equipment and trend over time

**Mean Time To Repair (MTTR)**:
- Formula: Total Downtime / Number of Repairs
- Lower is better (faster repairs)
- Improve through better planning, training, spare parts

**Overall Equipment Effectiveness (OEE)**:
- Formula: Availability × Performance × Quality
- World-class target: >85%
- Comprehensive measure of production efficiency

**Unplanned Downtime**:
- Total hours of unplanned equipment downtime
- Percentage of available production time
- Target: <5% or continuously improving

### Maintenance Effectiveness

**Planned Maintenance Percentage (PMP)**:
- Formula: (Planned Maintenance Hours / Total Maintenance Hours) × 100%
- Target: >80% (minimize reactive maintenance)

**Schedule Compliance**:
- Formula: (Work Orders Completed On Time / Total Scheduled) × 100%
- Target: >90%

**Preventive Maintenance Compliance (PMC)**:
- Formula: (PMs Completed / PMs Scheduled) × 100%
- Target: >95%

**Backlog (Weeks)**:
- Formula: Total Backlog Hours / Weekly Capacity Hours
- Target: 2-4 weeks (healthy balance)

### Cost Metrics

**Maintenance Cost as % of Replacement Asset Value (RAV)**:
- Formula: (Annual Maintenance Cost / RAV) × 100%
- Benchmark: 2-5% depending on industry and asset age

**Cost Per Unit Produced**:
- Formula: Total Maintenance Cost / Units Produced
- Track trend over time (should decrease with improvements)

**Spare Parts Inventory Turnover**:
- Formula: Annual Parts Usage / Average Inventory Value
- Target: 1-2 turns (balance availability vs. carrying cost)

## Safety and Compliance

### Lockout/Tagout (LOTO)

**Purpose**:
- Ensure equipment is properly shut off and cannot start during maintenance
- Protect workers from hazardous energy release

**Procedure**:
1. **Preparation**: Notify affected personnel
2. **Shutdown**: Shut down equipment using normal procedures
3. **Isolation**: Disconnect energy sources (electrical, pneumatic, hydraulic)
4. **Lockout**: Apply locks and tags to isolation points
5. **Verify**: Test that equipment cannot operate
6. **Service**: Perform maintenance safely
7. **Removal**: Remove locks/tags after work complete, verify safe to operate

**Requirements**:
- One lock per worker
- Personal locks (not shared)
- Tags describe work and responsible person
- Verification before restoration

### Confined Space Entry

**Hazards**:
- Oxygen deficiency or enrichment
- Toxic gases (CO, H2S, solvents)
- Flammable atmospheres
- Engulfment (liquids, solids)

**Permit Requirements**:
- Atmospheric testing before and during entry
- Ventilation (forced air)
- Continuous monitoring
- Attendant outside space
- Rescue plan and equipment

### Hot Work (Welding, Cutting, Grinding)

**Permit Requirements**:
- Fire watch before, during, and 30+ min after
- Remove flammables or use fire blankets
- Fire extinguisher readily available
- Notify security/fire department
- Verify work area safe after completion

## Integration with Other Agents

### Production Scheduling
- Coordinate maintenance windows with production schedule
- Prioritize maintenance for bottleneck equipment
- Communicate expected downtime and recovery

### Shop Floor
- Alert operators to equipment issues
- Real-time condition monitoring feedback
- Operator input on equipment performance

### Quality Management
- Equipment calibration and verification
- Link quality issues to equipment condition
- Preventive maintenance for measurement equipment

## Best Practices

### Data-Driven Culture
- Trust data over gut feel (but verify anomalies)
- Continuous monitoring and trending
- Root cause analysis of failures
- Share lessons learned across organization

### Proactive Mindset
- Shift from reactive to predictive
- Plan ahead, schedule maintenance during optimal windows
- Invest in sensors and analytics
- Continuous improvement of models and processes

### Cross-Functional Collaboration
- Maintenance, operations, engineering, and supply chain alignment
- Joint problem-solving for chronic issues
- Communicate equipment health and risks
- Shared goals and performance metrics

## Last Updated: November 2025`
  }
];

async function insertPlaybooks() {
  try {
    await client.connect();
    console.log('Connected to database');

    for (const playbook of defaultPlaybooks) {
      try {
        // Check if playbook with this title already exists
        const existing = await client.query(
          'SELECT id FROM playbooks WHERE title = $1',
          [playbook.title]
        );

        if (existing.rows.length > 0) {
          // Update existing playbook
          const result = await client.query(
            `UPDATE playbooks 
             SET description = $1, content = $2, agent_id = $3, category = $4, tags = $5, updated_at = NOW()
             WHERE title = $6
             RETURNING id`,
            [
              playbook.description,
              playbook.content,
              playbook.agentId,
              playbook.category,
              JSON.stringify(playbook.tags),
              playbook.title
            ]
          );
          console.log(`✓ Updated existing playbook: "${playbook.title}" (ID: ${result.rows[0].id})`);
        } else {
          // Insert new playbook
          const result = await client.query(
            `INSERT INTO playbooks (title, description, content, agent_id, category, tags, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
             RETURNING id`,
            [
              playbook.title,
              playbook.description,
              playbook.content,
              playbook.agentId,
              playbook.category,
              JSON.stringify(playbook.tags)
            ]
          );
          console.log(`✓ Inserted new playbook: "${playbook.title}" (ID: ${result.rows[0].id})`);
        }
      } catch (error) {
        console.error(`✗ Error processing playbook "${playbook.title}":`, error.message);
      }
    }

    console.log('\n✓ Successfully created default playbooks for all agents!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

insertPlaybooks();
