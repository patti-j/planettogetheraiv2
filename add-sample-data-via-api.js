// Simple script to add sample data via API endpoints once tables exist
const sampleData = {
  // Sample playbooks
  playbooks: [
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
      tags: ['scheduling', 'optimization', 'best-practices', 'theory-of-constraints', 'algorithms']
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

## Supplier Quality Management

### Supplier Approval Process
- Quality system assessment
- Product qualification
- On-site audit
- Ongoing monitoring

### Supplier Performance Metrics
- **Quality Rating**: PPM defects, cost of quality
- **Delivery Performance**: On-time delivery, lead time consistency
- **Service Rating**: Responsiveness, communication`,
      tags: ['quality', 'spc', 'inspection', 'procedures', 'troubleshooting', 'supplier-management']
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

## Safety Considerations

### Lockout/Tagout (LOTO)
- **Procedure**: Isolate energy sources before maintenance
- **Training**: Annual certification required
- **Audit**: Monthly LOTO compliance checks

### Personal Protective Equipment (PPE)
- **Safety glasses**: Required in all maintenance areas
- **Hard hats**: Required when overhead hazards exist
- **Safety shoes**: Steel toe required
- **Gloves**: Cut-resistant for handling sharp objects`,
      tags: ['maintenance', 'reliability', 'predictive-maintenance', 'oee', 'troubleshooting', 'safety']
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

## Continuous Improvement

### Kaizen Events
- Focus on specific waste reduction
- Cross-functional teams
- Rapid implementation
- Measure and sustain improvements

### Lean Principles
- **Eliminate Waste**: Transport, inventory, motion, waiting, overproduction, overprocessing, defects
- **5S Implementation**: Sort, set in order, shine, standardize, sustain
- **Pull Systems**: Produce only what is needed when needed`,
      tags: ['inventory', 'supply-chain', 'mrp', 'lean', 'warehouse', 'forecasting', 'continuous-improvement']
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

### Medical Emergency
**First Aid Response**:
1. Assess the situation for safety
2. Call 911 for serious injuries
3. Provide first aid within training limits
4. Do not move injured person unless in immediate danger
5. Stay with injured person until help arrives

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

## Safety Metrics
- **TRIR**: Total Recordable Incident Rate (target <1.0)
- **LTIR**: Lost Time Incident Rate (target <0.5)
- **Near Miss Ratio**: Target 10:1 near miss to incident ratio
- **Safety Training Completion**: 100% on-time completion`,
      tags: ['safety', 'emergency-response', 'loto', 'ppe', 'osha', 'training', 'incident-reporting']
    }
  ]
};

console.log('Sample playbooks ready for insertion via API:');
console.log(`${sampleData.playbooks.length} playbooks prepared`);
console.log('');
console.log('To add these via API endpoints:');
console.log('1. Create tables with npm run db:push first');
console.log('2. Use POST /api/playbooks for each playbook');
console.log('3. Use POST /api/agent-actions for agent history');
console.log('4. Use POST /api/max-ai/memories for AI memories');