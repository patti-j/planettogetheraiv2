import { db } from '../db';
import { agentActions, playbooks, playbookHistory, playbookUsage, users, aiMemories } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function seedAgentActionsAndPlaybooks() {
  console.log('🤖 Seeding Agent Actions and Playbooks...');

  try {
    // Get user IDs for attribution
    const allUsers = await db.select().from(users);
    const adminUser = allUsers.find(u => u.username === 'admin') || allUsers[0];
    const jimUser = allUsers.find(u => u.username === 'Jim') || allUsers[1];
    const pattiUser = allUsers.find(u => u.username === 'Patti') || allUsers[0];

    if (!adminUser) {
      console.log('❌ No users found, skipping agent actions and playbooks seeding');
      return;
    }

    // Sample Agent Actions - Recent AI actions taken by Max
    const sampleAgentActions = [
      {
        sessionId: 'session_001_scheduling',
        agentType: 'max',
        actionType: 'optimize',
        entityType: 'production_schedule',
        entityId: 'schedule_001',
        actionDescription: 'Optimized production schedule to reduce bottlenecks and improve resource utilization',
        reasoning: 'User requested schedule optimization due to capacity constraints on CNC machines. Applied Critical Path Method and resource leveling to minimize delays.',
        userPrompt: 'Can you optimize our production schedule? We have bottlenecks on the CNC machines.',
        beforeState: {
          total_duration: 120,
          resource_utilization: 65,
          bottlenecks: ['CNC Machine 1', 'CNC Machine 2'],
          on_time_delivery: 78
        },
        afterState: {
          total_duration: 105,
          resource_utilization: 87,
          bottlenecks: ['Assembly Station 3'],
          on_time_delivery: 92
        },
        undoInstructions: {
          method: 'api_call',
          endpoint: '/api/schedule/revert',
          data: { scheduleId: 'schedule_001', version: 'v1.2' }
        },
        batchId: 'batch_schedule_opt_001',
        executionTime: 2340,
        success: true,
        createdBy: adminUser.id
      },
      {
        sessionId: 'session_002_dashboard',
        agentType: 'max',
        actionType: 'create',
        entityType: 'dashboard',
        entityId: 'dash_production_kpi',
        actionDescription: 'Created comprehensive production KPI dashboard with real-time metrics',
        reasoning: 'User needed better visibility into production performance. Generated dashboard with key metrics: OEE, throughput, quality rates, and resource utilization.',
        userPrompt: 'I need a dashboard to track our production performance in real-time',
        beforeState: null,
        afterState: {
          widgets: 8,
          metrics: ['OEE', 'Throughput', 'Quality Rate', 'Downtime', 'Resource Utilization'],
          refresh_interval: 30
        },
        undoInstructions: {
          method: 'api_call',
          endpoint: '/api/dashboards/delete',
          data: { dashboardId: 'dash_production_kpi' }
        },
        batchId: 'batch_dashboard_001',
        executionTime: 1250,
        success: true,
        createdBy: jimUser?.id || adminUser.id
      },
      {
        sessionId: 'session_003_quality',
        agentType: 'analytics',
        actionType: 'analyze',
        entityType: 'quality_data',
        entityId: 'quality_analysis_week_34',
        actionDescription: 'Analyzed quality trends and identified root causes for defect rate increase',
        reasoning: 'Quality metrics showed 15% increase in defect rates. Performed statistical analysis and identified correlation with equipment maintenance schedules.',
        userPrompt: 'Our defect rates have increased this week. Can you analyze what\'s causing this?',
        beforeState: {
          defect_rate: 2.3,
          analysis_status: 'pending'
        },
        afterState: {
          defect_rate: 2.3,
          root_causes: ['Delayed maintenance on Line 2', 'Material quality variance', 'Operator training gap'],
          recommendations: ['Schedule immediate maintenance', 'Audit material supplier', 'Provide refresher training'],
          analysis_status: 'completed'
        },
        undoInstructions: {
          method: 'database_restore',
          data: { table: 'quality_analyses', recordId: 'quality_analysis_week_34' }
        },
        batchId: 'batch_quality_001',
        executionTime: 4200,
        success: true,
        createdBy: pattiUser?.id || adminUser.id
      },
      {
        sessionId: 'session_004_inventory',
        agentType: 'optimizer',
        actionType: 'update',
        entityType: 'inventory_levels',
        entityId: 'inv_aluminum_sheets',
        actionDescription: 'Adjusted inventory reorder points based on demand forecasting analysis',
        reasoning: 'Historical consumption data showed seasonal patterns. Updated reorder points to prevent stockouts during peak periods while minimizing carrying costs.',
        userPrompt: 'We keep running out of aluminum sheets. Can you optimize our inventory levels?',
        beforeState: {
          reorder_point: 500,
          safety_stock: 100,
          carrying_cost: 2400
        },
        afterState: {
          reorder_point: 750,
          safety_stock: 200,
          carrying_cost: 3200,
          stockout_risk: 'reduced by 78%'
        },
        undoInstructions: {
          method: 'api_call',
          endpoint: '/api/inventory/revert-settings',
          data: { itemId: 'inv_aluminum_sheets', previousSettings: { reorder_point: 500, safety_stock: 100 } }
        },
        batchId: 'batch_inventory_001',
        executionTime: 1800,
        success: true,
        createdBy: adminUser.id
      },
      {
        sessionId: 'session_005_maintenance',
        agentType: 'scheduler',
        actionType: 'create',
        entityType: 'maintenance_schedule',
        entityId: 'maint_sched_q4',
        actionDescription: 'Generated preventive maintenance schedule for Q4 with minimal production impact',
        reasoning: 'Equipment due for preventive maintenance. Optimized scheduling to occur during planned downtime and low-demand periods.',
        userPrompt: 'Schedule our Q4 preventive maintenance to minimize production disruption',
        beforeState: null,
        afterState: {
          maintenance_windows: 12,
          total_downtime_hours: 48,
          production_impact: 'minimal',
          equipment_covered: 15
        },
        undoInstructions: {
          method: 'api_call',
          endpoint: '/api/maintenance/delete-schedule',
          data: { scheduleId: 'maint_sched_q4' }
        },
        batchId: 'batch_maintenance_001',
        executionTime: 3100,
        success: true,
        createdBy: jimUser?.id || adminUser.id
      }
    ];

    // Insert sample agent actions
    for (const action of sampleAgentActions) {
      await db.insert(agentActions).values(action);
    }

    // Sample Playbooks - Manufacturing knowledge base
    const samplePlaybooks = [
      {
        title: 'Production Schedule Optimization Best Practices',
        content: `# Production Schedule Optimization Best Practices

## Overview
This playbook outlines the proven methodologies for optimizing production schedules in our manufacturing environment.

## Key Principles

### 1. Bottleneck Management
- **Identify Bottlenecks**: Use Theory of Constraints (TOC) to identify the most constraining resource
- **Drum-Buffer-Rope**: Schedule the bottleneck resource first, then subordinate all other resources
- **Buffer Management**: Maintain appropriate buffers before bottlenecks to ensure continuous operation

### 2. Optimization Algorithms
- **Critical Path Method (CPM)**: For project-based manufacturing
- **ASAP (As Soon As Possible)**: Minimizes completion time
- **ALAP (As Late As Possible)**: Minimizes inventory carrying costs
- **Resource Leveling**: Smooths resource utilization

### 3. Scheduling Considerations
- **Setup Time Optimization**: Group similar products to minimize changeovers
- **Due Date Performance**: Balance on-time delivery with efficiency
- **Resource Utilization**: Target 85-90% utilization on non-bottleneck resources

## Implementation Steps

1. **Data Preparation**
   - Verify BOM accuracy
   - Confirm routing information
   - Validate resource capacities
   - Check material availability

2. **Algorithm Selection**
   - Use ASAP for rush orders
   - Apply Resource Leveling for standard production
   - Implement TOC for bottleneck-constrained environments

3. **Schedule Validation**
   - Check material availability
   - Verify resource capacity
   - Confirm due date feasibility
   - Review quality gate requirements

## Common Issues and Solutions

### Issue: Frequent Schedule Changes
**Solution**: Implement frozen zones and rolling schedules

### Issue: Resource Conflicts
**Solution**: Use priority-based scheduling and alternative routings

### Issue: Material Shortages
**Solution**: Integrate MRP with real-time inventory data

## Metrics to Monitor
- Schedule adherence: Target >95%
- Resource utilization: 85-90% for non-bottlenecks
- On-time delivery: Target >98%
- Setup time as % of total time: <10%

## Related Procedures
- Material Planning Procedures
- Quality Control Procedures
- Preventive Maintenance Procedures`,
        tags: ['scheduling', 'optimization', 'best-practices', 'theory-of-constraints', 'algorithms'],
        createdBy: adminUser.id,
        lastEditedBy: adminUser.id
      },
      {
        title: 'Quality Control Procedures and Troubleshooting',
        content: `# Quality Control Procedures and Troubleshooting

## Standard Operating Procedures

### Incoming Material Inspection
1. **Visual Inspection**: Check for damage, contamination, proper labeling
2. **Dimensional Verification**: Verify critical dimensions per drawings
3. **Material Certification**: Review certificates of conformance
4. **Sample Testing**: Perform statistical sampling per AQL standards

### In-Process Quality Checks
- **First Article Inspection**: Complete dimensional and functional verification
- **Process Control**: Statistical process control (SPC) monitoring
- **Checkpoint Inspections**: Quality gates at critical operations
- **Tool Wear Monitoring**: Regular checking of cutting tools and fixtures

### Final Inspection
- **100% Functional Test**: All products must pass functional testing
- **Cosmetic Inspection**: Visual check for surface defects
- **Packaging Verification**: Correct labeling and packaging
- **Documentation**: Complete quality records and traceability

## Common Quality Issues and Root Causes

### Surface Defects
**Symptoms**: Scratches, dents, discoloration
**Root Causes**:
- Improper handling during transport
- Worn or damaged tooling
- Contaminated work surfaces
- Inadequate operator training

**Corrective Actions**:
- Implement proper handling procedures
- Replace worn tooling
- Clean work areas regularly
- Provide operator training

### Dimensional Variations
**Symptoms**: Parts outside tolerance specifications
**Root Causes**:
- Machine wear or misalignment
- Tool wear
- Temperature variations
- Setup errors

**Corrective Actions**:
- Calibrate machines regularly
- Monitor tool wear
- Control environmental conditions
- Standardize setup procedures

### Process Capability Issues
**Symptoms**: High Cpk values, frequent adjustments needed
**Root Causes**:
- Process variation too high
- Specification limits too tight
- Measurement system errors
- Unstable process conditions

## Statistical Process Control (SPC)

### Control Charts
- **X-bar and R Charts**: For continuous data
- **p Charts**: For attribute data (defect rates)
- **c Charts**: For defect counts
- **Individual Moving Range (IMR)**: For single measurements

### Process Capability Studies
- **Cpk Target**: >1.33 for critical characteristics
- **Ppk Target**: >1.67 for new processes
- **Control Limits**: ±3 sigma from process mean

### Measurement System Analysis (MSA)
- **Gage R&R Study**: <10% of tolerance for critical measurements
- **Bias and Linearity**: Assess measurement accuracy
- **Stability**: Monitor measurement system over time

## Nonconformance Management

### Immediate Actions
1. Segregate nonconforming material
2. Identify root cause
3. Implement containment actions
4. Document findings

### Corrective Actions
1. Develop permanent solution
2. Implement process improvements
3. Verify effectiveness
4. Update procedures as needed

### Preventive Actions
1. Identify potential issues
2. Implement prevention measures
3. Monitor for effectiveness
4. Continuous improvement

## Supplier Quality Management

### Supplier Approval Process
- Quality system assessment
- Product qualification
- On-site audit
- Ongoing monitoring

### Supplier Performance Metrics
- **Quality Rating**: PPM defects, cost of quality
- **Delivery Performance**: On-time delivery, lead time consistency
- **Service Rating**: Responsiveness, communication

## Training Requirements
- New employee quality orientation
- SPC training for operators
- Annual quality refresher training
- Specialized training for quality inspectors`,
        tags: ['quality', 'spc', 'inspection', 'procedures', 'troubleshooting', 'supplier-management'],
        createdBy: pattiUser?.id || adminUser.id,
        lastEditedBy: pattiUser?.id || adminUser.id
      },
      {
        title: 'Equipment Maintenance and Reliability Program',
        content: `# Equipment Maintenance and Reliability Program

## Maintenance Strategy Overview

### Preventive Maintenance (PM)
- **Time-based**: Scheduled at regular intervals
- **Usage-based**: Based on operating hours or cycles
- **Condition-based**: Triggered by equipment condition

### Predictive Maintenance (PdM)
- **Vibration Analysis**: Monitor bearing and rotating equipment health
- **Thermography**: Detect electrical and mechanical issues
- **Oil Analysis**: Monitor fluid condition and wear particles
- **Ultrasonic Testing**: Detect leaks and electrical issues

### Reactive Maintenance
- **Emergency Repairs**: Unplanned maintenance due to failures
- **Corrective Actions**: Address identified issues during inspections

## Equipment Criticality Classification

### Critical Equipment (A-Class)
- **Definition**: Failure causes production stoppage or safety risk
- **PM Frequency**: Weekly to monthly inspections
- **Spare Parts**: Full inventory maintained
- **Response Time**: <2 hours

### Important Equipment (B-Class)
- **Definition**: Failure causes production delay or quality issues
- **PM Frequency**: Monthly to quarterly inspections
- **Spare Parts**: Key components stocked
- **Response Time**: <8 hours

### Non-Critical Equipment (C-Class)
- **Definition**: Failure has minimal production impact
- **PM Frequency**: Quarterly to annual inspections
- **Spare Parts**: Ordered as needed
- **Response Time**: <24 hours

## Maintenance Procedures

### Daily Equipment Checks
- Visual inspection for leaks, unusual noise, vibration
- Lubrication point checks
- Safety device verification
- Cleanliness inspection

### Weekly Maintenance Tasks
- Detailed equipment inspection
- Lubrication per manufacturer schedule
- Belt tension and alignment checks
- Filter replacements

### Monthly Maintenance Tasks
- Comprehensive equipment evaluation
- Calibration verification
- Predictive maintenance data collection
- Spare parts inventory review

## Troubleshooting Guidelines

### Electrical Issues
**Symptoms**: No power, intermittent operation, overheating
**Common Causes**:
- Loose connections
- Worn contacts
- Overloaded circuits
- Environmental factors

**Troubleshooting Steps**:
1. Check power supply and connections
2. Measure voltage and current
3. Inspect contactors and relays
4. Check for environmental issues

### Mechanical Issues
**Symptoms**: Excessive noise, vibration, misalignment
**Common Causes**:
- Worn bearings
- Misalignment
- Unbalanced rotating parts
- Lubrication issues

**Troubleshooting Steps**:
1. Listen for unusual noises
2. Feel for excessive vibration
3. Check alignment with laser tools
4. Inspect lubrication points

### Hydraulic/Pneumatic Issues
**Symptoms**: Slow operation, erratic movement, leaks
**Common Causes**:
- Contaminated fluid
- Worn seals
- Clogged filters
- Incorrect pressure settings

**Troubleshooting Steps**:
1. Check fluid levels and condition
2. Inspect for external leaks
3. Verify pressure settings
4. Replace filters as needed

## Key Performance Indicators (KPIs)

### Overall Equipment Effectiveness (OEE)
- **Target**: >85%
- **Components**: Availability × Performance × Quality

### Mean Time Between Failures (MTBF)
- **Target**: Increasing trend
- **Calculation**: Operating time ÷ Number of failures

### Mean Time To Repair (MTTR)
- **Target**: <2 hours for critical equipment
- **Calculation**: Total repair time ÷ Number of repairs

### Maintenance Cost as % of Replacement Value
- **Target**: <3% annually
- **Components**: Labor + parts + contractor costs

## Spare Parts Management

### Inventory Strategy
- **Critical Items**: 2-3 months supply
- **Important Items**: 1-2 months supply
- **Non-Critical Items**: Just-in-time ordering

### Stock Optimization
- **ABC Analysis**: Prioritize based on criticality and cost
- **Economic Order Quantity**: Balance carrying costs with ordering costs
- **Supplier Agreements**: Establish blanket orders for key components

## Safety Considerations

### Lockout/Tagout (LOTO)
- **Procedure**: Isolate energy sources before maintenance
- **Training**: Annual certification required
- **Audit**: Monthly LOTO compliance checks

### Personal Protective Equipment (PPE)
- **Safety glasses**: Required in all maintenance areas
- **Hard hats**: Required when overhead hazards exist
- **Safety shoes**: Steel toe required
- **Gloves**: Cut-resistant for handling sharp objects

### Confined Space Entry
- **Permit System**: Required for all confined space work
- **Gas Testing**: Oxygen, combustible gas, toxic gas monitoring
- **Attendant**: Required for all confined space entries`,
        tags: ['maintenance', 'reliability', 'predictive-maintenance', 'oee', 'troubleshooting', 'safety'],
        createdBy: jimUser?.id || adminUser.id,
        lastEditedBy: jimUser?.id || adminUser.id
      },
      {
        title: 'Inventory Management and Material Flow Optimization',
        content: `# Inventory Management and Material Flow Optimization

## Inventory Classification and Control

### ABC Analysis
- **A Items (20% of items, 80% of value)**:
  - Daily monitoring
  - Tight inventory control
  - Multiple supplier sources
  - Economic order quantity optimization

- **B Items (30% of items, 15% of value)**:
  - Weekly monitoring
  - Standard inventory control
  - Regular supplier review
  - Periodic order optimization

- **C Items (50% of items, 5% of value)**:
  - Monthly monitoring
  - Simple inventory control
  - Annual supplier review
  - Bulk ordering for economies of scale

### XYZ Analysis (Demand Variability)
- **X Items**: Consistent, predictable demand
- **Y Items**: Seasonal or cyclical demand patterns
- **Z Items**: Sporadic, unpredictable demand

## Inventory Planning Methods

### Material Requirements Planning (MRP)
**Input Data Required**:
- Master Production Schedule (MPS)
- Bill of Materials (BOM)
- Inventory records
- Lead times

**MRP Logic**:
1. Calculate gross requirements
2. Subtract available inventory
3. Calculate net requirements
4. Offset by lead time

### Reorder Point System
**Formula**: ROP = (Average Daily Usage × Lead Time) + Safety Stock

**Safety Stock Calculation**:
- Service level approach
- Statistical approach using standard deviation
- Judgment-based approach for critical items

### Just-in-Time (JIT)
**Principles**:
- Pull system based on customer demand
- Eliminate waste in all forms
- Continuous improvement (Kaizen)
- Strong supplier partnerships

## Warehouse Operations

### Receiving Procedures
1. **Advanced Shipment Notice (ASN)** verification
2. **Physical inspection** for damage and quantity
3. **Quality inspection** per incoming inspection procedures
4. **System receipt** and label generation
5. **Put-away** to designated locations

### Storage Optimization
- **ABC Storage**: Place A items in most accessible locations
- **FIFO/FEFO**: First-in-first-out for dated materials
- **Hazmat Segregation**: Separate incompatible materials
- **Temperature Control**: Climate-controlled areas for sensitive items

### Picking Operations
- **Batch Picking**: Multiple orders picked simultaneously
- **Zone Picking**: Pickers assigned to specific areas
- **Wave Planning**: Optimize picking sequences
- **Pick Path Optimization**: Minimize travel time

### Cycle Counting
- **Daily Counts**: A items counted daily
- **Weekly Counts**: B items counted weekly
- **Monthly Counts**: C items counted monthly
- **Root Cause Analysis**: Investigate variances >2%

## Supply Chain Optimization

### Supplier Management
**Supplier Scorecard Metrics**:
- Quality: PPM defects, incoming reject rate
- Delivery: On-time delivery, lead time consistency
- Cost: Price competitiveness, cost reduction initiatives
- Service: Responsiveness, communication quality

**Supplier Development**:
- Regular business reviews
- Joint improvement projects
- Supplier audits and assessments
- Long-term partnership agreements

### Demand Forecasting
**Forecasting Methods**:
- **Moving Average**: Simple trend analysis
- **Exponential Smoothing**: Weighted recent data
- **Seasonal Decomposition**: Account for seasonal patterns
- **Regression Analysis**: Use leading indicators

**Forecast Accuracy Metrics**:
- Mean Absolute Percentage Error (MAPE): <10% target
- Bias: Minimize systematic over/under forecasting
- Tracking Signal: Monitor forecast performance

### Transportation Management
**Inbound Logistics**:
- Milk run optimization for local suppliers
- Consolidated shipments to reduce costs
- Cross-docking for fast-moving items
- Vendor-managed inventory (VMI) for key suppliers

**Outbound Logistics**:
- Route optimization for deliveries
- Load planning and consolidation
- Carrier performance management
- Customer delivery scheduling

## Technology and Systems

### Warehouse Management System (WMS)
**Core Functions**:
- Real-time inventory visibility
- Automated put-away and picking
- Labor management and productivity tracking
- Integration with ERP systems

### Barcode and RFID Systems
- **Barcode**: Cost-effective for most applications
- **RFID**: For high-value items and automated tracking
- **Voice Picking**: Hands-free operation
- **Mobile Devices**: Real-time data capture and verification

## Key Performance Indicators

### Inventory Metrics
- **Inventory Turnover**: Target >12 turns per year
- **Days on Hand**: Target <30 days
- **Stockout Rate**: <2% for critical items
- **Obsolete Inventory**: <5% of total inventory value

### Warehouse Metrics
- **Order Fill Rate**: >99% target
- **Pick Accuracy**: >99.5% target
- **Cycle Count Accuracy**: >98% target
- **Labor Productivity**: Picks per hour by operation

### Supply Chain Metrics
- **Supplier On-Time Delivery**: >98% target
- **Freight Cost as % of Sales**: Monitor trend
- **Perfect Order Rate**: >95% target
- **Cash-to-Cash Cycle Time**: Minimize days

## Continuous Improvement

### Kaizen Events
- Focus on specific waste reduction
- Cross-functional teams
- Rapid implementation
- Measure and sustain improvements

### Value Stream Mapping
- Document current state
- Identify waste and bottlenecks
- Design future state
- Implement improvements systematically

### Lean Principles
- **Eliminate Waste**: Transport, inventory, motion, waiting, overproduction, overprocessing, defects
- **5S Implementation**: Sort, set in order, shine, standardize, sustain
- **Pull Systems**: Produce only what is needed when needed`,
        tags: ['inventory', 'supply-chain', 'mrp', 'lean', 'warehouse', 'forecasting', 'continuous-improvement'],
        createdBy: adminUser.id,
        lastEditedBy: adminUser.id
      },
      {
        title: 'Safety Procedures and Emergency Response',
        content: `# Safety Procedures and Emergency Response

## General Safety Guidelines

### Personal Protective Equipment (PPE)
**Minimum Requirements for Manufacturing Areas**:
- Safety glasses with side shields
- Steel-toe safety shoes
- Long pants (no shorts or open-toed shoes)
- Hair restraints for long hair

**Additional PPE by Area**:
- **Machine Shop**: Cut-resistant gloves, hearing protection
- **Welding Area**: Welding helmet, flame-resistant clothing, welding gloves
- **Chemical Storage**: Chemical-resistant gloves, face shield, respirator if required
- **Material Handling**: Back support belt, high-visibility vest

### Lockout/Tagout (LOTO) Procedures
**Purpose**: Prevent unexpected energization during maintenance

**Energy Sources to Control**:
- Electrical
- Pneumatic
- Hydraulic
- Mechanical (stored energy)
- Thermal
- Chemical

**LOTO Steps**:
1. **Notify** affected employees of shutdown
2. **Shut down** equipment using normal procedures
3. **Isolate** all energy sources
4. **Apply** lockout/tagout devices
5. **Verify** isolation by attempting to start equipment
6. **Perform** maintenance work
7. **Remove** lockout/tagout devices
8. **Restore** equipment to normal operation

### Machine Guarding
**Requirements**:
- All rotating machinery must have guards
- Point-of-operation guards on all machines
- Emergency stop buttons within easy reach
- Light curtains or pressure mats for automated equipment

**Inspection Requirements**:
- Daily visual inspection by operators
- Weekly detailed inspection by supervisors
- Monthly safety audit by safety committee
- Annual comprehensive inspection by safety engineer

## Hazard Communication

### Chemical Safety
**Safety Data Sheets (SDS)**:
- Maintain current SDS for all chemicals
- Make SDS accessible to all employees
- Review SDS before using new chemicals
- Train employees on SDS interpretation

**Chemical Labeling**:
- All containers must be labeled
- Use proper hazard pictograms
- Include precautionary statements
- Maintain legible labels

**Chemical Storage**:
- Segregate incompatible chemicals
- Store in approved containers
- Maintain proper ventilation
- Use secondary containment for liquids

### Ergonomics
**Lifting Guidelines**:
- Maximum manual lift: 50 lbs
- Team lift for loads >50 lbs
- Use mechanical aids when available
- Proper lifting technique training required

**Workstation Design**:
- Adjustable work surfaces
- Anti-fatigue mats for standing operations
- Proper lighting (minimum 50 foot-candles)
- Temperature control (68-76°F)

## Emergency Procedures

### Fire Emergency
**Immediate Actions**:
1. **RACE Protocol**:
   - **Rescue**: Remove people from immediate danger
   - **Alarm**: Pull fire alarm and call 911
   - **Contain**: Close doors to contain fire
   - **Evacuate**: Exit via nearest safe route

**Fire Extinguisher Use (PASS Method)**:
- **Pull** the pin
- **Aim** at base of fire
- **Squeeze** the handle
- **Sweep** side to side

**Fire Extinguisher Types**:
- **Class A**: Ordinary combustibles (paper, wood, plastic)
- **Class B**: Flammable liquids (oil, gasoline, paint)
- **Class C**: Electrical fires
- **Class D**: Combustible metals

### Medical Emergency
**First Aid Response**:
1. Assess the situation for safety
2. Call 911 for serious injuries
3. Provide first aid within training limits
4. Do not move injured person unless in immediate danger
5. Stay with injured person until help arrives

**First Aid Supplies**:
- First aid kits located every 150 feet
- AED units in main production areas
- Emergency eyewash stations near chemical use areas
- Emergency showers for chemical exposure areas

### Chemical Spill Response
**Small Spills (<1 gallon)**:
1. Ensure personal safety first
2. Contain spill to prevent spreading
3. Use appropriate spill kit materials
4. Clean up per SDS instructions
5. Dispose of waste properly

**Large Spills (>1 gallon)**:
1. Evacuate immediate area
2. Call emergency response team
3. Prevent others from entering area
4. Notify management immediately
5. Contact environmental compliance

### Severe Weather
**Tornado Warning**:
- Move to interior rooms on lowest floor
- Stay away from windows and large roof areas
- Assume protective position (crouch, cover head)
- Remain in shelter until all-clear given

**Flood Warning**:
- Move to higher ground
- Shut off electrical equipment if safe to do so
- Do not drive through flooded areas
- Monitor weather radio for updates

## Safety Training Requirements

### New Employee Orientation
- General safety rules and procedures
- PPE requirements and proper use
- Emergency procedures and evacuation routes
- Hazard communication and chemical safety
- Incident reporting procedures

### Job-Specific Training
- Machine-specific safety procedures
- LOTO procedures for assigned equipment
- Chemical handling for work area
- Ergonomics for assigned tasks
- Quality and safety integration

### Ongoing Training
- Annual safety refresher training
- Monthly safety meetings
- Quarterly emergency drills
- Annual LOTO recertification
- Specialized training as needed

## Incident Investigation and Reporting

### Incident Reporting
**Who Must Report**:
- Any employee involved in or witnessing incident
- Supervisors must investigate and report within 24 hours
- Safety department must review all incidents

**What to Report**:
- All injuries requiring first aid or medical treatment
- Near misses with potential for serious injury
- Property damage incidents
- Environmental releases or spills

### Investigation Process
1. **Immediate Response**: Secure scene, provide medical aid
2. **Fact Gathering**: Interview witnesses, photograph scene
3. **Root Cause Analysis**: Use 5-Why or fishbone analysis
4. **Corrective Actions**: Develop and implement solutions
5. **Follow-up**: Verify effectiveness of corrective actions

### Safety Metrics
- **TRIR**: Total Recordable Incident Rate (target <1.0)
- **LTIR**: Lost Time Incident Rate (target <0.5)
- **Near Miss Ratio**: Target 10:1 near miss to incident ratio
- **Safety Training Completion**: 100% on-time completion

## Regulatory Compliance

### OSHA Requirements
- Maintain OSHA 300 injury and illness log
- Post annual summary (February 1 - April 30)
- Conduct required training and maintain records
- Perform required inspections and maintain documentation

### Environmental Compliance
- Air emissions monitoring and reporting
- Wastewater discharge permits and monitoring
- Hazardous waste management and disposal
- Spill prevention and response planning`,
        tags: ['safety', 'emergency-response', 'loto', 'ppe', 'osha', 'training', 'incident-reporting'],
        createdBy: pattiUser?.id || adminUser.id,
        lastEditedBy: pattiUser?.id || adminUser.id
      },
      {
        title: 'Operation Sequencing and Priority Management',
        content: `# Operation Sequencing and Priority Management

## Overview
Effective operation sequencing is critical for optimizing production flow, minimizing bottlenecks, and meeting delivery commitments. This playbook provides guidelines for sequencing operations and managing priorities.

## Sequencing Methods

### Forward Scheduling (ASAP - As Soon As Possible)
**When to Use**:
- Rush orders requiring fastest completion
- Customer commitments with tight deadlines
- New product introductions needing quick turnaround
- Make-to-order environments

**Benefits**:
- Minimizes total completion time
- Maximizes resource utilization
- Reduces work-in-progress inventory
- Improves cash flow

**Implementation**:
1. Schedule operations immediately after predecessor completion
2. Start all operations at earliest possible time
3. Consider resource availability constraints
4. Account for setup times between jobs
5. Validate material availability

### Backward Scheduling (ALAP - As Late As Possible)
**When to Use**:
- Make-to-stock production planning
- Managing inventory carrying costs
- Long lead time materials
- Seasonal demand patterns

**Benefits**:
- Minimizes inventory holding costs
- Reduces obsolescence risk
- Better cash flow management
- Just-in-time production alignment

**Implementation**:
1. Start from required completion date
2. Work backwards through operations
3. Calculate latest start times
4. Maintain safety buffers at bottlenecks
5. Verify material ordering dates

### Theory of Constraints (Drum-Buffer-Rope)
**When to Use**:
- Environments with clear bottleneck resources
- High-mix production with capacity constraints
- Continuous improvement focused operations

**Drum** (Bottleneck Scheduling):
- Schedule bottleneck resource to maximum capacity
- Protect bottleneck from starvation
- Subordinate all other resources to bottleneck

**Buffer** (Time Protection):
- Time buffer before bottleneck (typically 1-2 shifts)
- Shipping buffer to protect delivery dates
- Assembly buffer for convergent points

**Rope** (Material Release):
- Release materials based on bottleneck schedule
- Tie material release to bottleneck consumption
- Limit work-in-process to buffer requirements

## Priority Rules and Dispatching

### Priority Ranking Factors
1. **Customer Priority**
   - Strategic customer relationships
   - Contract penalties for late delivery
   - Market share considerations
   - Emergency or service orders

2. **Due Date Urgency**
   - Days until due date
   - Slack time remaining
   - Critical ratio (time remaining / work remaining)

3. **Order Value**
   - Revenue contribution
   - Profit margin
   - Strategic product importance

4. **Setup Optimization**
   - Setup time similarity
   - Color/material changeover requirements
   - Tooling configuration needs

### Dispatching Rules

#### Shortest Processing Time (SPT)
- **Use When**: Minimizing average flow time
- **Benefit**: Quick wins, high throughput
- **Risk**: Long jobs may be delayed

#### Earliest Due Date (EDD)
- **Use When**: Meeting delivery commitments is priority
- **Benefit**: Fewer late orders
- **Risk**: May not optimize throughput

#### Critical Ratio (CR)
- **Formula**: (Due Date - Today) / (Work Days Remaining)
- **CR < 1.0**: Order is behind schedule
- **CR = 1.0**: Order is on schedule
- **CR > 1.0**: Order has slack time
- **Use When**: Balancing multiple objectives

#### First-In-First-Out (FIFO)
- **Use When**: Simple, fair processing required
- **Benefit**: Easy to understand and implement
- **Risk**: Ignores urgency and importance

## Resource Allocation Strategy

### Load Balancing
**Objectives**:
- Smooth workload across resources
- Minimize idle time
- Avoid overloading critical resources
- Maintain consistent flow

**Techniques**:
- Resource leveling algorithms
- Alternate routing utilization
- Cross-training for flexibility
- Parallel processing where possible

### Setup Reduction
**Family Grouping**:
- Group similar products together
- Minimize color/material changeovers
- Batch similar configurations

**SMED (Single-Minute Exchange of Dies)**:
- External setup preparation
- Standardized tooling and fixtures
- Quick-change mechanisms
- Setup checklists

### Capacity Management
**Peak Demand Strategies**:
- Planned overtime utilization
- Shift differential scheduling
- Temporary labor augmentation
- Outsourcing options

**Low Demand Strategies**:
- Preventive maintenance scheduling
- Training and development
- Process improvement projects
- Build-ahead for stable products

## Job Shop vs Flow Shop Considerations

### Job Shop Scheduling
**Characteristics**:
- High variety, low volume
- Complex routing through work centers
- Significant setup times
- Custom or semi-custom products

**Best Practices**:
- Use visual scheduling boards
- Maintain flexibility in routing
- Focus on bottleneck optimization
- Real-time priority updates

### Flow Shop Scheduling
**Characteristics**:
- Lower variety, higher volume
- Consistent routing sequence
- Standardized operations
- Repetitive production

**Best Practices**:
- Balance line rates
- Minimize buffer inventory
- Standardize work content
- Continuous flow optimization

## Operation Sequencer Tool Usage

### Daily Scheduling Workflow
1. **Morning Review** (7:00 AM)
   - Review overnight changes
   - Check material arrivals
   - Confirm resource availability
   - Update priorities based on new information

2. **Mid-Day Adjustment** (12:00 PM)
   - Monitor actual vs planned progress
   - Adjust sequences for delays or rush orders
   - Communicate changes to production floor
   - Update estimated completion times

3. **End-of-Day Planning** (4:00 PM)
   - Prepare next day's schedule
   - Confirm material staging
   - Communicate tomorrow's priorities
   - Lock schedule for overnight shift

### Sequence Optimization
**Drag-and-Drop Reordering**:
- Visual interface for quick adjustments
- Real-time feasibility validation
- Automatic dependency checking
- Impact analysis on downstream operations

**Filtering and Views**:
- By resource/work center
- By customer or product line
- By priority level
- By time window (today, this week, etc.)

**Save and Compare Scenarios**:
- Create "what-if" scenarios
- Compare completion times
- Evaluate resource utilization
- Choose optimal sequence

## Performance Metrics

### Schedule Performance
- **Schedule Adherence**: Actual vs planned completion
  - Target: >95%
- **On-Time Delivery**: Orders delivered by due date
  - Target: >98%
- **Schedule Stability**: Changes in final 72 hours
  - Target: <5% changes

### Resource Metrics
- **Resource Utilization**: Productive time vs available time
  - Target: 85-90% for non-bottlenecks
  - Target: 95%+ for bottleneck resources
- **Setup Time %**: Setup time as % of total time
  - Target: <10%

### Flow Metrics
- **Cycle Time**: Time from order release to completion
  - Track trend, aim for reduction
- **Work-in-Process (WIP)**: Active jobs on floor
  - Target: Minimize while maintaining flow
- **Flow Time Ratio**: Actual time / theoretical minimum time
  - Target: <2.0

## Common Challenges and Solutions

### Challenge: Frequent Hot Jobs Disrupt Schedule
**Solution**:
- Reserve capacity for expedites (10-15%)
- Implement hot job process with approval
- Analyze root causes of hot jobs
- Improve demand forecasting

### Challenge: Setup Times Too Long
**Solution**:
- Implement SMED methodology
- Create setup reduction teams
- Standardize tooling and fixtures
- Use family grouping

### Challenge: Resource Conflicts
**Solution**:
- Cross-train operators
- Maintain alternate routings
- Use priority matrix for decisions
- Implement finite capacity scheduling

### Challenge: Material Shortages
**Solution**:
- Integrate MRP with scheduling
- Real-time inventory visibility
- Supplier performance management
- Safety stock for critical items

## Best Practices

1. **Freeze Zone**: Maintain a frozen schedule for near-term (24-48 hours) to provide stability
2. **Visual Management**: Use visual boards or digital displays to communicate priorities
3. **Daily Huddles**: Brief morning meetings to review schedule and priorities
4. **Exception Management**: Focus on exceptions rather than routine operations
5. **Continuous Improvement**: Regularly review and optimize sequencing rules
6. **Cross-Functional**: Involve planning, production, and materials in scheduling decisions
7. **Data-Driven**: Use actual performance data to refine algorithms and rules
8. **Flexible but Disciplined**: Allow flexibility for urgent needs while maintaining discipline

## Related Tools and Integration
- Production Scheduler (Gantt chart view)
- Inventory Management System
- Quality Control Integration
- Shop Floor Data Collection
- Customer Order Management`,
        tags: ['scheduling', 'sequencing', 'priority-management', 'toc', 'dispatching', 'asap', 'alap', 'operation-sequencer'],
        createdBy: jimUser?.id || adminUser.id,
        lastEditedBy: jimUser?.id || adminUser.id
      },
      {
        title: 'Capacity Planning and Resource Optimization',
        content: `# Capacity Planning and Resource Optimization

## Overview
Capacity planning ensures that production resources are available to meet demand while optimizing utilization and minimizing costs. This playbook covers capacity analysis, planning methods, and optimization strategies.

## Capacity Analysis

### Capacity Types

#### Design Capacity
- **Definition**: Maximum theoretical output under ideal conditions
- **Use**: Long-term planning and investment decisions
- **Calculation**: Based on engineering specifications and optimal conditions

#### Effective Capacity
- **Definition**: Maximum output under normal operating conditions
- **Factors**: Maintenance, breaks, typical efficiency losses
- **Calculation**: Design capacity × availability factor × performance efficiency

#### Demonstrated Capacity
- **Definition**: Actual proven output based on historical performance
- **Use**: Realistic scheduling and planning
- **Calculation**: Average of recent actual production output

### Capacity Metrics

**Utilization Rate**:
\`\`\`
Utilization = (Actual Output / Design Capacity) × 100%
Target: 85-90% for non-bottleneck resources
Target: 95%+ for bottleneck resources
\`\`\`

**Efficiency Rate**:
\`\`\`
Efficiency = (Actual Output / Effective Capacity) × 100%
Target: >90%
\`\`\`

**Overall Equipment Effectiveness (OEE)**:
\`\`\`
OEE = Availability × Performance × Quality
Availability = Operating Time / Planned Production Time
Performance = (Actual Output × Ideal Cycle Time) / Operating Time
Quality = Good Units / Total Units
Target OEE: >85% world-class
\`\`\`

## Rough-Cut Capacity Planning (RCCP)

### Purpose
- Validate master production schedule feasibility
- Identify capacity constraints early
- Support make-or-buy decisions
- Guide capital investment planning

### Steps

1. **Calculate Required Capacity**
   - For each product in MPS
   - Multiply quantity by standard hours per unit
   - Sum by resource/work center
   - Extend over planning horizon

2. **Compare to Available Capacity**
   - Gather resource capacity data
   - Account for planned downtime
   - Consider efficiency factors
   - Identify gaps

3. **Resolve Capacity Issues**
   - **Underutilization**: Reduce capacity, add products, fill with make-to-stock
   - **Overutilization**: Add capacity, subcontract, adjust schedule, reduce commitments

### Capacity Planning Using Overall Factors (CPOF)
- **Quick rough-cut method**
- Uses overall planning factors
- Good for aggregate planning
- Not detailed enough for execution

### Capacity Bills Method
- **More detailed than CPOF**
- Uses bill of resources
- Capacity per end item
- Better accuracy for rough-cut planning

### Resource Profiles Method
- **Most detailed RCCP approach**
- Time-phased capacity requirements
- Lead time offset included
- Best accuracy for rough-cut planning

## Finite Capacity Scheduling

### Principles
**Finite Loading**:
- Respect capacity constraints
- No resource overloading
- Realistic completion dates
- Material and capacity synchronized

**Characteristics**:
- All resources have limited capacity
- Jobs scheduled within available capacity
- May extend due dates if capacity insufficient
- Provides achievable schedules

### Implementation

**Scheduling Rules**:
1. **Forward Finite**: Schedule ASAP respecting capacity
2. **Backward Finite**: Schedule ALAP respecting capacity
3. **Critical Ratio**: Priority-based finite scheduling

**Capacity Constraints**:
- Resource availability calendars
- Setup time requirements
- Tool and fixture availability
- Skilled labor constraints
- Material availability

### Optimization Objectives
- **Minimize Makespan**: Total completion time
- **Minimize Tardiness**: Late delivery penalties
- **Maximize Utilization**: Efficient resource use
- **Minimize WIP**: Reduce inventory carrying costs
- **Balance Load**: Smooth workload distribution

## Capacity Expansion Strategies

### Short-Term Adjustments (0-3 months)

**Overtime**:
- **Pros**: Quick, flexible, no capital required
- **Cons**: Higher labor costs, fatigue, quality risks
- **Target**: <10% overtime as sustainable

**Temporary Labor**:
- **Pros**: Flexible, scalable, lower commitment
- **Cons**: Training required, quality variability
- **Best for**: Seasonal peaks, specific skills

**Shift Differential**:
- **Pros**: Utilizes existing equipment, spreads fixed costs
- **Cons**: Premium pay, supervision requirements
- **Target**: 2-3 shift operation for bottlenecks

**Outsourcing/Subcontracting**:
- **Pros**: Quick capacity, no capital investment
- **Cons**: Quality control, cost, IP concerns
- **Best for**: Non-core operations, overflow

### Medium-Term Adjustments (3-12 months)

**Equipment Additions**:
- Used equipment purchase
- Equipment leasing
- Bottleneck debottlenecking
- Process improvement

**Workforce Expansion**:
- New hire recruitment
- Cross-training programs
- Contractor to employee conversion
- Shift additions

**Process Improvements**:
- Setup time reduction (SMED)
- Cycle time optimization
- Yield improvement
- Quality enhancement

### Long-Term Adjustments (1-3+ years)

**Capital Investment**:
- New production lines
- Advanced automation
- Facility expansion
- Technology upgrades

**Strategic Planning**:
- Make vs buy analysis
- Vertical integration decisions
- Geographic expansion
- Acquisition or partnership

## Bottleneck Management

### Identification Methods

**Statistical Analysis**:
- Highest utilization percentage
- Longest queue times
- Most frequent delays
- Maximum work-in-process

**Value Stream Mapping**:
- Visual flow analysis
- Identify constraint points
- Measure throughput rates
- Document wait times

### Theory of Constraints (TOC) Five Focusing Steps

1. **Identify the Constraint**
   - Which resource limits throughput?
   - Use data analysis and observation
   - May be resource, policy, or market

2. **Exploit the Constraint**
   - Maximize constraint productivity
   - Eliminate waste at constraint
   - No unplanned downtime
   - Best operators assigned

3. **Subordinate Everything Else**
   - Align all resources to constraint
   - Upstream: Don't overproduce
   - Downstream: Always ready to accept
   - Schedule based on constraint capacity

4. **Elevate the Constraint**
   - Increase constraint capacity
   - Add equipment, shifts, or outsource
   - Only if exploitation insufficient

5. **Prevent Inertia - Return to Step 1**
   - Constraint may have moved
   - Continuous improvement cycle
   - Don't let past constraint become dogma

### Constraint Buffer Management

**Time Buffers**:
- **Purpose**: Protect constraint from disruption
- **Size**: Typically 1-2 shifts worth of work
- **Management**: Monitor buffer penetration

**Buffer Zones**:
- **Green Zone** (67-100%): Normal operation
- **Yellow Zone** (34-66%): Monitor closely
- **Red Zone** (0-33%): Immediate action required

## Load Leveling and Smoothing

### Heijunka (Production Leveling)

**Volume Leveling**:
- Distribute production evenly over time
- Avoid peaks and valleys
- Reduce capacity needs
- Improve flow

**Mix Leveling**:
- Distribute product mix evenly
- Reduce changeovers
- Balance skill requirements
- Smooth material consumption

### Takt Time
**Calculation**:
\`\`\`
Takt Time = Available Production Time / Customer Demand
\`\`\`

**Application**:
- Pace of production to meet demand
- Balance work content to takt
- Identify capacity gaps
- Synchronize operations

### Pitch
**Definition**: Takt time × pack quantity
- Schedule production by pitch increments
- Visual production control
- Small, manageable batches

## Advanced Planning Techniques

### Aggregate Planning
- **Time Horizon**: 3-18 months
- **Decisions**: Production rates, workforce levels, inventory
- **Methods**: Level strategy, chase strategy, hybrid

**Level Strategy**:
- Constant production rate
- Absorb demand variation with inventory
- Stable workforce
- Lower hiring/training costs

**Chase Strategy**:
- Match production to demand
- Variable workforce
- Minimal inventory
- Higher HR costs

### Master Production Scheduling (MPS)
- **Time Horizon**: 8-12 weeks
- **Purpose**: Bridge aggregate plan to execution
- **Outputs**: Specific product quantities and dates

### Material Requirements Planning (MRP)
- **Inputs**: MPS, BOM, inventory, lead times
- **Logic**: Time-phased requirements calculation
- **Outputs**: Planned orders for materials and components

## Performance Monitoring

### Capacity Dashboards
**Key Metrics**:
- Current utilization by resource
- Available capacity (hours/units)
- Capacity vs demand trend
- Bottleneck identification
- Overtime hours
- Backlog analysis

### Regular Reviews
**Daily**: Bottleneck status, urgent capacity issues
**Weekly**: Utilization review, short-term capacity planning
**Monthly**: Capacity trends, efficiency analysis
**Quarterly**: Strategic capacity review, investment planning

## Best Practices

1. **Maintain Accurate Data**: Routing, cycle times, setup times, capacity calendars
2. **Proactive Planning**: Forecast demand changes, plan capacity ahead
3. **Focus on Constraints**: Protect and optimize bottleneck resources
4. **Continuous Improvement**: Regular review of capacity utilization and efficiency
5. **Integrated Planning**: Align capacity planning with business strategy
6. **Flexible Capacity**: Maintain options for quick capacity adjustments
7. **Visual Management**: Make capacity status visible to all stakeholders
8. **Cross-Functional Collaboration**: Sales, operations, and finance alignment

## Tools and Systems
- Capacity planning software
- Finite capacity scheduler
- ERP system integration
- Production monitoring systems
- Analytics and reporting dashboards`,
        tags: ['capacity-planning', 'resource-optimization', 'bottleneck', 'toc', 'finite-scheduling', 'oee', 'heijunka', 'takt-time'],
        createdBy: adminUser.id,
        lastEditedBy: adminUser.id
      },
      {
        title: 'Schedule Change Management and Communication',
        content: `# Schedule Change Management and Communication

## Overview
Production schedules must adapt to changing conditions, but too much change creates chaos. This playbook establishes protocols for managing schedule changes professionally and communicating them effectively.

## Change Control Principles

### Frozen Zone Concept
**Definition**: A time window where schedule changes are prohibited or heavily restricted

**Standard Frozen Zones**:
- **Immediate (0-24 hours)**: Frozen - no changes except emergencies
- **Near-term (24-72 hours)**: Restricted - supervisor approval required
- **Medium-term (3-7 days)**: Managed - planning approval required
- **Long-term (>7 days)**: Flexible - normal change process

**Benefits**:
- Production floor stability
- Material planning accuracy
- Labor scheduling reliability
- Reduced expediting costs

### Change Classification

#### Emergency Changes (Red)
**Definition**: Immediate safety, quality, or customer emergency issues

**Examples**:
- Safety recall or critical safety issue
- Major quality defect requiring immediate action
- Top customer emergency order (VP approval)
- Equipment failure forcing reschedule

**Process**:
1. Immediate authorization by operations manager
2. Document change and reason
3. Communicate to all affected parties within 1 hour
4. Post-change review within 24 hours

#### Urgent Changes (Yellow)
**Definition**: Important changes needed within frozen zone

**Examples**:
- Hot customer order (premium pricing)
- Material shortage requiring substitution
- Unplanned equipment downtime >4 hours
- Critical employee absence

**Process**:
1. Submit change request to production supervisor
2. Assess impact on current schedule
3. Approval by supervisor or planning manager
4. Document change reason and impact
5. Communicate to affected parties within 2 hours

#### Normal Changes (Green)
**Definition**: Standard planning changes outside frozen zone

**Examples**:
- Demand forecast updates
- New customer orders
- Scheduled maintenance
- Standard order cancellations

**Process**:
1. Submit change request to planning
2. Evaluate impact and alternatives
3. Update schedule in next planning cycle
4. Communicate in daily planning meeting

## Change Request Process

### Request Documentation
**Required Information**:
- Requester name and department
- Change category (emergency/urgent/normal)
- Affected jobs/orders
- Reason for change
- Requested timing
- Business impact if not approved
- Alternative solutions considered

### Impact Assessment
**Evaluation Criteria**:
1. **Customer Impact**
   - Will any customer commitments be missed?
   - What is the relationship/revenue impact?
   - Are there contract penalties?

2. **Resource Impact**
   - Does it create overtime?
   - Are special skills required?
   - Equipment/tooling availability?

3. **Material Impact**
   - Is material available for change?
   - Will existing material become excess?
   - Lead time considerations?

4. **Cost Impact**
   - Premium freight charges?
   - Overtime costs?
   - Setup/changeover costs?
   - Potential contract penalties?

5. **Other Orders Impact**
   - How many other orders affected?
   - Cascade effect on schedule?
   - Overall delivery performance impact?

### Decision Matrix
\`\`\`
Urgency Level | Within Frozen Zone | Approval Required
Emergency     | Yes                | Operations Manager
Emergency     | No                 | Production Supervisor
Urgent        | Yes                | Planning Manager + Supervisor
Urgent        | No                 | Production Supervisor
Normal        | N/A (not allowed)  | N/A
Normal        | No                 | Planning Team
\`\`\`

## Communication Protocols

### Communication Channels

**Immediate (Within 1 hour)**:
- Radio announcement to production floor
- Text message to supervisors
- Email to planning and materials
- Update visual schedule boards

**Near-term (Within 2-4 hours)**:
- Email to affected departments
- Update in production system
- Discussion in next shift meeting
- Post to visual management board

**Standard (Same day)**:
- Include in daily planning report
- Discuss in morning production meeting
- Update master schedule
- Email summary to stakeholders

### Stakeholder Notification

**Production Floor**:
- Specific jobs affected
- New sequence and timing
- Reason for change
- Resource/material implications

**Materials/Planning**:
- Material requirements changes
- New delivery expectations
- Inventory implications
- Purchase order impacts

**Quality**:
- Changes to first article inspection needs
- Updated test requirements
- Documentation updates

**Maintenance**:
- Equipment availability needs
- Tool/fixture requirements
- Timing of planned maintenance

**Sales/Customer Service**:
- Customer delivery date impacts
- Reasons for changes
- Alternative options if applicable

### Communication Templates

**Emergency Change Notification**:
\`\`\`
URGENT SCHEDULE CHANGE - IMMEDIATE ACTION REQUIRED

Change Type: Emergency
Time: [Timestamp]
Affected Jobs: [List job numbers]

CHANGE DETAILS:
Original Schedule: [Description]
New Schedule: [Description]
Reason: [Brief explanation]

ACTION REQUIRED:
- Production: [Specific actions]
- Materials: [Specific actions]  
- Quality: [Specific actions]

Questions contact: [Name] at [Extension]
\`\`\`

**Standard Change Notice**:
\`\`\`
Schedule Update - [Date]

The following changes have been made to the production schedule:

Job #[XXX]: [Original date] → [New date]
Reason: [Explanation]
Impact: [Brief impact statement]

Job #[YYY]: [Original date] → [New date]  
Reason: [Explanation]
Impact: [Brief impact statement]

Please review and prepare accordingly.
Questions: Planning at ext. [XXXX]
\`\`\`

## Schedule Stability Metrics

### Measurement
**Schedule Stability Index**:
\`\`\`
Stability = (1 - Changes in Last 72 Hours / Total Jobs) × 100%
Target: >95%
\`\`\`

**Change Frequency by Type**:
- Emergency changes per week: Target <2
- Urgent changes per week: Target <5
- Normal changes per week: Acceptable
- Total changes in frozen zone: Target <5%

**Root Cause Tracking**:
- Material shortage: X%
- Equipment failure: Y%
- Customer changes: Z%
- Planning errors: A%
- Quality issues: B%

### Continuous Improvement
**Monthly Review**:
- Analyze change frequency and root causes
- Identify improvement opportunities
- Update processes to reduce disruptions
- Share lessons learned

**Action Plans**:
- Address top 3 root causes
- Implement preventive measures
- Track effectiveness
- Adjust protocols as needed

## Best Practices

### Minimize Changes
1. **Better Forecasting**: Improve demand planning accuracy
2. **Supplier Partnerships**: Reduce material shortage disruptions
3. **Preventive Maintenance**: Minimize unplanned equipment downtime
4. **Quality Systems**: Prevent quality-related reschedules
5. **Cross-Training**: Reduce labor-related schedule impacts

### When Changes are Necessary
1. **Act Quickly**: Don't delay necessary changes
2. **Communicate Clearly**: Explain why change is needed
3. **Document Thoroughly**: Track for analysis and improvement
4. **Learn and Improve**: Use data to prevent future issues
5. **Respect Frozen Zone**: Maintain discipline for stability

### Tools and Visual Management
1. **Digital Displays**: Real-time schedule status
2. **Color Coding**: Visual priority indicators
3. **Change Log**: Track all changes in one place
4. **Impact Dashboard**: Show cascade effects
5. **Stability Metrics**: Display performance trends

## Roles and Responsibilities

### Planning Team
- Evaluate change requests
- Assess schedule impact
- Approve/deny normal changes
- Maintain schedule integrity
- Communicate changes

### Production Supervisors
- Approve urgent changes in frozen zone
- Implement schedule changes on floor
- Communicate to operators
- Provide feedback on feasibility

### Operations Manager
- Approve emergency changes
- Review change metrics monthly
- Drive continuous improvement
- Escalation point for conflicts

### Materials Team
- Assess material availability
- Manage material implications
- Communicate supplier impacts
- Adjust purchasing as needed

### Quality Team
- Review quality implications
- Update inspection requirements
- Adjust test schedules
- Validate change feasibility

## Emergency Response Procedures

### Equipment Failure
1. Assess failure severity and repair time
2. Identify jobs affected
3. Determine alternate equipment/routing
4. Reschedule affected jobs
5. Communicate changes
6. Update preventive maintenance if applicable

### Material Shortage
1. Confirm actual shortage and ETA
2. Check for substitution options
3. Identify affected jobs
4. Prioritize by customer importance
5. Reschedule or expedite as appropriate
6. Communicate to affected parties

### Customer Emergency Order
1. Verify priority level and approval
2. Assess capacity availability
3. Identify jobs to be delayed if necessary
4. Calculate cost implications
5. Get required approvals
6. Implement change and communicate

## Integration with Other Systems
- ERP production scheduling module
- Shop floor data collection
- Material requirements planning
- Customer order management
- Email and messaging systems
- Visual management displays`,
        tags: ['schedule-management', 'change-control', 'communication', 'frozen-zone', 'stability', 'coordination', 'emergency-response'],
        createdBy: jimUser?.id || adminUser.id,
        lastEditedBy: jimUser?.id || adminUser.id
      }
    ];

    // Insert sample playbooks
    for (const playbook of samplePlaybooks) {
      await db.insert(playbooks).values(playbook);
    }

    // Get the inserted playbook IDs for history and usage records
    const insertedPlaybooks = await db.select().from(playbooks);

    // Sample Playbook History entries
    const playbookHistoryEntries = [
      {
        playbookId: insertedPlaybooks[0].id,
        previousContent: 'Initial draft content',
        newContent: insertedPlaybooks[0].content,
        changeType: 'created',
        changeDescription: 'Initial creation of production schedule optimization playbook',
        editedBy: adminUser.id
      },
      {
        playbookId: insertedPlaybooks[1].id,
        previousContent: null,
        newContent: insertedPlaybooks[1].content,
        changeType: 'created',
        changeDescription: 'Created comprehensive quality control procedures playbook',
        editedBy: pattiUser?.id || adminUser.id
      },
      {
        playbookId: insertedPlaybooks[0].id,
        previousContent: insertedPlaybooks[0].content,
        newContent: insertedPlaybooks[0].content + '\n\n## Updated: Added TOC implementation notes',
        changeType: 'updated',
        changeDescription: 'Added Theory of Constraints implementation examples',
        editedBy: jimUser?.id || adminUser.id
      }
    ];

    // Insert playbook history
    for (const historyEntry of playbookHistoryEntries) {
      await db.insert(playbookHistory).values(historyEntry);
    }

    // Sample Playbook Usage entries
    const playbookUsageEntries = [
      {
        playbookId: insertedPlaybooks[0].id,
        userId: jimUser?.id || adminUser.id,
        actionType: 'applied',
        context: 'Used during weekly production planning meeting',
        effectivenessRating: 5
      },
      {
        playbookId: insertedPlaybooks[1].id,
        userId: pattiUser?.id || adminUser.id,
        actionType: 'referenced',
        context: 'Quality issue investigation for Line 2',
        effectivenessRating: 4
      },
      {
        playbookId: insertedPlaybooks[2].id,
        userId: adminUser.id,
        actionType: 'viewed',
        context: 'Preventive maintenance planning',
        effectivenessRating: 5
      },
      {
        playbookId: insertedPlaybooks[3].id,
        userId: jimUser?.id || adminUser.id,
        actionType: 'applied',
        context: 'Inventory optimization project',
        effectivenessRating: 4
      }
    ];

    // Insert playbook usage
    for (const usageEntry of playbookUsageEntries) {
      await db.insert(playbookUsage).values(usageEntry);
    }

    // Sample AI Memories for Max
    const aiMemories = [
      {
        userId: adminUser.id.toString(),
        type: 'knowledge',
        category: 'scheduling_optimization',
        content: 'User prefers Critical Path Method for rush orders and Resource Leveling for standard production. Always consider bottleneck resources first when optimizing schedules.',
        context: 'Production scheduling preferences learned from multiple interactions',
        confidence: 95,
        importance: 90,
        source: 'user_interaction'
      },
      {
        userId: pattiUser?.id.toString() || adminUser.id.toString(),
        type: 'knowledge',
        category: 'quality_management',
        content: 'Quality team prefers SPC charts for continuous processes and immediate root cause analysis for any defect rate increase >5%. Material supplier audits should be triggered automatically.',
        context: 'Quality control workflow preferences',
        confidence: 90,
        importance: 85,
        source: 'user_interaction'
      },
      {
        userId: jimUser?.id.toString() || adminUser.id.toString(),
        type: 'knowledge',
        category: 'maintenance_strategy',
        content: 'Maintenance team uses condition-based maintenance for critical equipment (CNC machines, injection molders). Preventive maintenance windows preferred during second shift.',
        context: 'Maintenance scheduling preferences and strategies',
        confidence: 88,
        importance: 80,
        source: 'user_interaction'
      },
      {
        userId: adminUser.id.toString(),
        type: 'preference',
        category: 'dashboard_configuration',
        content: 'Prefers real-time KPI dashboards with 30-second refresh rates. Key metrics: OEE, resource utilization, on-time delivery, quality rate. Mobile-responsive design required.',
        context: 'Dashboard preferences from recent dashboard creation sessions',
        confidence: 92,
        importance: 75,
        source: 'user_interaction'
      }
    ];

    // Insert AI memories
    for (const memory of aiMemories) {
      await db.insert(aiMemories).values(memory);
    }

    console.log('✅ Successfully seeded agent actions and playbooks data');
    console.log(`   - ${sampleAgentActions.length} agent actions created`);
    console.log(`   - ${samplePlaybooks.length} playbooks created`);
    console.log(`   - ${playbookHistoryEntries.length} playbook history entries created`);
    console.log(`   - ${playbookUsageEntries.length} playbook usage entries created`);
    console.log(`   - ${aiMemories.length} AI memories created`);

  } catch (error) {
    console.error('❌ Error seeding agent actions and playbooks:', error);
    throw error;
  }
}