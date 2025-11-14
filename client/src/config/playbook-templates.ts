export interface PlaybookTemplate {
  id: string;
  title: string;
  scenario: string;
  agentId: string;
  category: string;
  content: string;
  description: string;
  useCases: string[];
}

export interface IndustryTemplate {
  id: string;
  label: string;
  description: string;
  templates: PlaybookTemplate[];
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "pharmaceutical",
    label: "Pharmaceutical Manufacturing",
    description: "Templates for pharmaceutical production, quality control, and regulatory compliance",
    templates: [
      {
        id: "pharma-batch-validation",
        title: "Batch Production Validation Protocol",
        scenario: "Automated validation and compliance checking for pharmaceutical batch production",
        agentId: "quality_management",
        category: "Quality & Compliance",
        description: "Ensures each pharmaceutical batch meets FDA/EMA regulatory requirements with automated validation checks",
        useCases: [
          "API batch validation",
          "Tablet/capsule batch verification",
          "Injectable solution quality checks",
          "GMP compliance validation"
        ],
        content: `# Batch Production Validation Protocol

## Objective
Automate quality validation for pharmaceutical batch production to ensure regulatory compliance and product safety.

## Pre-Production Checks
1. Verify all raw materials are within specification
2. Confirm equipment calibration certificates are current
3. Validate environmental conditions (temperature, humidity, cleanliness)
4. Check operator qualifications and training records

## In-Process Monitoring
- Monitor critical process parameters (CPPs)
- Track critical quality attributes (CQAs)
- Document all deviations immediately
- Perform in-process testing per batch record

## Post-Production Validation
1. Complete all quality tests (assay, dissolution, content uniformity)
2. Verify batch documentation completeness
3. Review electronic batch record (EBR) for discrepancies
4. Generate certificate of analysis (CoA)

## Compliance Actions
- If any specification fails, initiate deviation investigation
- Document root cause analysis for all out-of-specification results
- Escalate to Quality Assurance for batch disposition decision
- Update batch status in ERP system

## Agent Triggers
- Automatically flag batches with incomplete documentation
- Alert when critical parameters exceed limits
- Notify QA team of deviations requiring investigation
- Generate compliance reports for regulatory audits`
      },
      {
        id: "pharma-shelf-life-planning",
        title: "Pharmaceutical Shelf Life Management",
        scenario: "Proactive inventory management based on expiration dates and shelf life monitoring",
        agentId: "inventory_planning",
        category: "Inventory Planning",
        description: "Manages pharmaceutical inventory with focus on expiration dates, FEFO rotation, and waste prevention",
        useCases: [
          "Expiration date tracking",
          "FEFO (First Expired, First Out) optimization",
          "Waste minimization",
          "Stability program monitoring"
        ],
        content: `# Pharmaceutical Shelf Life Management

## Objective
Optimize pharmaceutical inventory to minimize waste while ensuring product quality and patient safety.

## Monitoring Strategy
### Daily Actions
- Scan inventory for items within 90 days of expiration
- Generate alerts for slow-moving items approaching expiry
- Review FEFO compliance in picking operations
- Track temperature excursions that may impact stability

### Weekly Review
- Analyze aging inventory report
- Identify products requiring accelerated distribution
- Review stability study data for lot-specific shelf life
- Coordinate with sales for promotion of short-dated items

## Inventory Disposition Rules
**Green Zone (>180 days to expiry)**: Normal stock rotation
**Yellow Zone (90-180 days)**: Prioritize for distribution, monitor closely
**Red Zone (<90 days)**: Accelerated distribution, discount pricing, or destruction planning
**Expired**: Immediate quarantine, initiate destruction protocol

## Optimization Actions
1. Use predictive analytics to reduce inventory of short shelf-life SKUs
2. Implement just-in-time replenishment for fast-moving products
3. Coordinate with production scheduling to align batch sizes with demand
4. Partner with distributors for consignment or vendor-managed inventory

## Agent Triggers
- Alert when inventory aging exceeds targets
- Notify sales team of short-dated inventory for promotional campaigns
- Escalate high-value expiring inventory to management
- Generate waste reports and cost impact analysis`
      },
      {
        id: "pharma-demand-forecast",
        title: "Pharmaceutical Demand Forecasting with Seasonality",
        scenario: "Forecast demand for seasonal medications and adjust production planning accordingly",
        agentId: "demand_management",
        category: "Demand Planning",
        description: "Predicts demand patterns for pharmaceutical products considering seasonality, disease prevalence, and market trends",
        useCases: [
          "Seasonal flu medication planning",
          "Chronic disease medication forecasting",
          "New drug launch planning",
          "Regulatory approval impact analysis"
        ],
        content: `# Pharmaceutical Demand Forecasting with Seasonality

## Objective
Accurately forecast pharmaceutical demand to optimize production, reduce stockouts, and minimize waste.

## Data Sources
### Internal Data
- Historical sales by SKU, month, and geography
- Production capacity and lead times
- Inventory levels and days of supply
- Promotional calendar and pricing changes

### External Data
- Disease prevalence and epidemiological trends
- Seasonal patterns (flu season, allergy season)
- Regulatory approvals and patent expirations
- Competitor launches and market share changes

## Forecasting Methodology
**Short-term (0-3 months)**: Time series analysis with seasonal adjustment
**Medium-term (3-12 months)**: Causal forecasting incorporating market trends
**Long-term (1-3 years)**: Scenario planning with new product launches

## Seasonal Adjustment Factors
- Allergy medications: Peak in spring/fall
- Flu medications: Peak in winter months
- Pain relievers: Relatively stable year-round
- Chronic disease medications: Steady demand with gradual growth

## Forecast Accuracy Metrics
- Mean Absolute Percentage Error (MAPE) target: <15%
- Bias: Should remain within ±5%
- Forecast Value Added (FVA): Positive value vs. naive forecast

## Production Planning Integration
1. Share 18-month rolling forecast with production scheduling
2. Trigger capacity expansion planning when sustained demand growth >20%
3. Coordinate with procurement for API and excipient lead times
4. Align inventory targets with forecast variability (higher safety stock for volatile products)

## Agent Triggers
- Alert when forecast deviates >20% from actual demand
- Notify production planning of major forecast revisions
- Escalate supply gaps where demand exceeds available capacity
- Generate monthly forecast accuracy reports for S&OP meetings`
      }
    ]
  },
  {
    id: "chemical",
    label: "Chemical Manufacturing",
    description: "Templates for chemical process optimization, safety protocols, and batch control",
    templates: [
      {
        id: "chem-reactor-optimization",
        title: "Chemical Reactor Yield Optimization",
        scenario: "Maximize reactor yield while maintaining safety and product quality specifications",
        agentId: "production_scheduling",
        category: "Process Optimization",
        description: "Optimizes chemical reactor parameters to maximize yield, reduce cycle time, and ensure safety compliance",
        useCases: [
          "Batch reactor optimization",
          "Continuous process improvement",
          "Catalyst efficiency monitoring",
          "Energy consumption reduction"
        ],
        content: `# Chemical Reactor Yield Optimization

## Objective
Maximize chemical reactor yield and efficiency while maintaining strict safety and quality standards.

## Key Performance Indicators
- **Yield**: Target >95% theoretical yield
- **Cycle Time**: Minimize total batch time while maintaining quality
- **Energy Efficiency**: Reduce heating/cooling energy per kg product
- **Quality**: Product purity must meet specification (typically >99%)

## Process Variables to Optimize
### Temperature Control
- Reaction temperature profile (ramp rates, hold times)
- Exotherm management for safety
- Cooling/quench timing for product quality

### Pressure Management
- Maintain optimal reactor pressure for reaction kinetics
- Monitor pressure relief valve settings
- Track pressure trends for equipment health

### Feed Rates & Mixing
- Raw material feed rates and sequencing
- Agitation speed for optimal mixing
- Residence time distribution

### Catalyst Performance
- Monitor catalyst activity over batch cycles
- Track catalyst loading and regeneration frequency
- Optimize catalyst replacement intervals

## Optimization Workflow
1. **Data Collection**: Gather real-time data from DCS/SCADA systems
2. **Analysis**: Identify correlations between process variables and yield
3. **Modeling**: Use historical data to build predictive models
4. **Implementation**: Test optimized parameters in controlled trials
5. **Validation**: Confirm improved yield without compromising safety/quality
6. **Standardization**: Update batch recipes with optimized parameters

## Safety Interlocks (Cannot Be Overridden)
- Maximum reactor temperature limits
- Pressure relief system activation points
- Emergency shutdown (ESD) triggers
- Toxic gas detection thresholds

## Agent Triggers
- Alert when yield drops below 90% (investigate immediately)
- Notify when cycle time exceeds historical average by >10%
- Escalate repeated safety interlock activations
- Generate weekly performance reports comparing actual vs. target KPIs`
      },
      {
        id: "chem-hazmat-handling",
        title: "Hazardous Material Handling Protocol",
        scenario: "Safe handling, storage, and transportation of hazardous chemicals with regulatory compliance",
        agentId: "shop_floor",
        category: "Safety & Compliance",
        description: "Ensures safe handling of hazardous chemicals following OSHA, EPA, and DOT regulations",
        useCases: [
          "Chemical spill response",
          "Hazmat storage management",
          "SDS (Safety Data Sheet) compliance",
          "Transportation safety"
        ],
        content: `# Hazardous Material Handling Protocol

## Objective
Ensure safe handling, storage, and transportation of hazardous chemicals in compliance with all applicable regulations.

## Regulatory Framework
- **OSHA Hazard Communication Standard (29 CFR 1910.1200)**
- **EPA RCRA (Resource Conservation and Recovery Act)**
- **DOT Hazardous Materials Regulations (49 CFR)**
- **NFPA 704 Hazard Identification System**

## Pre-Handling Requirements
### Training & Certification
- All personnel must complete hazmat training (initial + annual refresher)
- Specific training for corrosives, flammables, oxidizers, toxics
- Emergency response team certification for spill response

### Personal Protective Equipment (PPE)
- Chemical-resistant gloves (material specific to chemical class)
- Safety goggles or face shields
- Lab coat or chemical-resistant apron
- Respiratory protection when required (fit-tested annually)

## Storage Requirements
### Segregation Rules
- **Incompatible Chemicals Must Be Separated**: Acids/bases, oxidizers/flammables
- Use dedicated storage cabinets with secondary containment
- Store flammables in approved flammable storage cabinets (<60 gallons per cabinet)
- Oxidizers in separate, well-ventilated areas

### Labeling & Documentation
- All containers must have GHS-compliant labels
- Safety Data Sheets (SDS) must be readily accessible (electronic or physical)
- Inventory tracking system updated within 24 hours of receipt
- Conduct monthly inventory reconciliation

## Spill Response Protocol
**Minor Spill (<1 gallon)**:
1. Alert nearby personnel
2. Don appropriate PPE
3. Contain spill with absorbent material
4. Dispose of waste per RCRA guidelines
5. Document incident in spill log

**Major Spill (>1 gallon or unknown chemical)**:
1. Evacuate area immediately
2. Activate emergency response team
3. Isolate spill area (do not attempt cleanup)
4. Notify EHS manager and regulatory agencies if reportable quantity
5. Complete detailed incident investigation

## Transportation Safety
- Use DOT-approved containers and labeling
- Complete shipping papers with proper hazard class
- Secure containers to prevent movement during transport
- Provide emergency response information (ERG guide number)

## Agent Triggers
- Alert when hazmat inventory exceeds storage capacity limits
- Notify when SDS is >3 years old (request updated version)
- Escalate when spill response equipment inspection is overdue
- Generate monthly hazmat usage and disposal reports for regulatory submittal`
      },
      {
        id: "chem-preventive-maintenance",
        title: "Chemical Plant Preventive Maintenance Schedule",
        scenario: "Equipment maintenance scheduling to prevent unplanned downtime and ensure safety",
        agentId: "predictive_maintenance",
        category: "Maintenance",
        description: "Schedules and tracks preventive maintenance for chemical processing equipment to maximize uptime and safety",
        useCases: [
          "Pump and valve maintenance",
          "Heat exchanger cleaning",
          "Reactor inspection scheduling",
          "Instrumentation calibration"
        ],
        content: `# Chemical Plant Preventive Maintenance Schedule

## Objective
Maximize equipment reliability and safety through systematic preventive maintenance planning.

## Equipment Classification
### Critical Equipment (Maintenance Priority 1)
- Safety relief valves and rupture discs
- Emergency shutdown systems
- Fire suppression equipment
- Reactor temperature/pressure instrumentation

### Production Equipment (Priority 2)
- Reactors and vessels
- Pumps and compressors
- Heat exchangers
- Distillation columns

### Support Equipment (Priority 3)
- Cooling towers
- HVAC systems
- Lighting and general utilities
- Non-critical instrumentation

## Maintenance Frequencies
**Daily Checks**:
- Visual inspection of critical equipment for leaks, unusual noise
- Review alarm logs and trends
- Verify safety system functionality

**Weekly PM**:
- Lubrication of rotating equipment
- Belt tension and alignment checks
- Filter replacements (where applicable)

**Monthly PM**:
- Vibration analysis on critical pumps/motors
- Calibration verification of process instrumentation
- Safety shower and eyewash station testing
- Emergency lighting tests

**Quarterly PM**:
- Detailed equipment inspections
- Non-destructive testing (NDT) for corrosion/erosion
- Safety relief valve testing and certification
- Heat exchanger performance verification

**Annual PM**:
- Major turnaround/shutdown activities
- Vessel internal inspections
- Electrical system testing (thermography, breaker testing)
- Certification renewals (pressure vessels, lifting equipment)

## Scheduling Optimization
1. **Coordinate with Production**: Schedule PM during planned production downtime
2. **Batch Similar Activities**: Group maintenance tasks by area/craft to improve efficiency
3. **Critical Path Analysis**: Identify longest-duration tasks and schedule first
4. **Spare Parts Availability**: Confirm all parts are in stock before PM window

## Work Order Management
- Generate work orders 30 days before due date
- Assign work to qualified technicians (certifications verified)
- Provide detailed PM checklists and safety permits
- Require sign-off by supervisor before equipment return to service
- Document all findings and corrective actions in CMMS

## Agent Triggers
- Alert when PM task is overdue by >7 days
- Notify when critical spare parts inventory is below minimum
- Escalate when repeated failures occur on same equipment (>3 in 6 months)
- Generate monthly KPIs: PM compliance %, equipment uptime, MTBF/MTTR trends`
      }
    ]
  },
  {
    id: "food-beverage",
    label: "Food & Beverage",
    description: "Templates for food safety, HACCP compliance, and production scheduling",
    templates: [
      {
        id: "food-haccp-monitoring",
        title: "HACCP Critical Control Point Monitoring",
        scenario: "Real-time monitoring of critical control points to ensure food safety and regulatory compliance",
        agentId: "quality_management",
        category: "Food Safety",
        description: "Monitors HACCP critical control points (CCPs) to prevent food safety hazards",
        useCases: [
          "Temperature monitoring for cook/chill operations",
          "Metal detection verification",
          "pH control for acidified foods",
          "Allergen control and segregation"
        ],
        content: `# HACCP Critical Control Point Monitoring

## Objective
Continuously monitor HACCP critical control points to prevent biological, chemical, and physical hazards in food production.

## Identified Critical Control Points (CCPs)

### CCP-1: Cooking/Heat Treatment
**Hazard**: Survival of pathogenic bacteria (Salmonella, Listeria, E. coli)
**Critical Limit**: Internal temperature ≥165°F (74°C) for poultry; ≥145°F (63°C) for beef/pork
**Monitoring**: Continuous temperature probes with data logging every 30 seconds
**Corrective Action**: If temperature not met, extend cook time or reprocess batch
**Verification**: Calibrate temperature probes weekly

### CCP-2: Cooling
**Hazard**: Growth of spore-forming bacteria (Clostridium perfringens)
**Critical Limit**: Cool from 135°F to 70°F within 2 hours, then 70°F to 41°F within 4 hours
**Monitoring**: Automated temperature loggers; manual checks every hour
**Corrective Action**: Accelerate cooling (ice bath, blast chiller) or discard product
**Verification**: Review cooling curves for all batches

### CCP-3: Metal Detection
**Hazard**: Physical contamination with metal fragments
**Critical Limit**: Ferrous: 2.0mm, Non-ferrous: 2.5mm, Stainless steel: 3.5mm
**Monitoring**: In-line metal detector on every production line; test piece verification every hour
**Corrective Action**: Reject contaminated product, inspect upstream equipment
**Verification**: Monthly metal detector sensitivity testing by qualified technician

### CCP-4: pH Control (Acidified Foods)
**Hazard**: Growth of Clostridium botulinum in low-acid foods
**Critical Limit**: pH ≤4.6 for shelf-stable products
**Monitoring**: In-line pH probe with continuous data logging
**Corrective Action**: Add acid to achieve target pH or reprocess
**Verification**: Calibrate pH probes daily using buffer solutions

## Monitoring Frequency & Documentation
- **Real-Time**: Automated sensors with data logged to SCADA system
- **Periodic Manual Checks**: Hourly verification by production operators
- **Supervisor Review**: End-of-shift sign-off on all CCP records
- **QA Audit**: Daily review of all CCP monitoring data for trends/deviations

## Deviation Management
1. **Immediate Response**: Stop production if critical limit exceeded
2. **Isolate Product**: Quarantine all product produced since last compliant reading
3. **Root Cause Investigation**: Determine why deviation occurred
4. **Corrective Action**: Implement fix and verify effectiveness
5. **Product Disposition**: QA manager decides to release, rework, or destroy
6. **Documentation**: Complete deviation report within 24 hours

## Regulatory Compliance
- Maintain HACCP records for minimum 2 years (or longer per state regulations)
- Make records available for FDA/USDA inspection upon request
- Conduct annual HACCP plan reassessment or when process changes
- Train all production personnel on HACCP principles annually

## Agent Triggers
- Alert when CCP approaches critical limit (warning threshold at 90% of limit)
- Escalate immediately when critical limit is exceeded
- Notify QA manager of any deviations requiring product disposition decision
- Generate daily HACCP summary report for management review`
      },
      {
        id: "food-allergen-control",
        title: "Allergen Control & Changeover Protocol",
        scenario: "Prevent cross-contact of food allergens during production changeovers",
        agentId: "production_scheduling",
        category: "Food Safety",
        description: "Manages production scheduling and changeover procedures to prevent allergen cross-contact",
        useCases: [
          "Production scheduling by allergen profile",
          "Changeover validation and cleaning verification",
          "Allergen labeling compliance",
          "Supplier allergen certification"
        ],
        content: `# Allergen Control & Changeover Protocol

## Objective
Prevent allergen cross-contact to protect allergic consumers and ensure compliance with FALCPA labeling requirements.

## Major Food Allergens (FDA)
1. Milk
2. Eggs
3. Fish (e.g., bass, flounder, cod)
4. Crustacean shellfish (e.g., crab, lobster, shrimp)
5. Tree nuts (e.g., almonds, walnuts, pecans)
6. Peanuts
7. Wheat
8. Soybeans
9. Sesame

## Production Scheduling Strategy
### Allergen Segregation by Time
- **Schedule allergen-free products first in production run**
- **Group products with same allergen profile together**
- **Schedule major allergen products last (especially peanuts, tree nuts)**
- **Plan for extended changeover time when switching from allergen to non-allergen**

### Dedicated Lines (Where Feasible)
- Maintain dedicated equipment for high-risk allergens (peanut, tree nut lines)
- Use separate storage areas for allergenic ingredients
- Color-code utensils and tools by allergen category

## Changeover & Cleaning Procedures
**Pre-Changeover**:
1. Remove all remaining product and ingredients from line
2. Dispose of or properly store work-in-progress containing allergens
3. Post signage indicating allergen changeover in progress

**Cleaning Process**:
1. Dry cleaning: Remove all visible product residue
2. Wet cleaning: Use approved detergent and hot water (>160°F)
3. Rinse thoroughly with potable water
4. Sanitize equipment surfaces (if required by SOP)
5. Visual inspection by qualified personnel (sign-off required)

**Verification**:
- **ATP swabbing**: Random sampling of food contact surfaces (<100 RLU passing criteria)
- **Allergen test kits**: ELISA or lateral flow assays for specific allergens
- **First production batches**: Hold and test for allergen presence before release
- **Frequency**: Every changeover from allergenic to non-allergenic product

## Labeling & Traceability
- All allergen-containing products must have FALCPA-compliant labels
- "Contains: [allergen list]" statement in bold
- "May contain" or "Processed in a facility that also processes" advisory statements (when appropriate)
- Lot code traceability to link finished product back to raw materials

## Supplier Management
- Require allergen statements from all ingredient suppliers
- Maintain updated supplier allergen matrices
- Conduct supplier audits for high-risk ingredients (especially co-manufacturers)
- Review Certificate of Analysis (CoA) for allergen testing results

## Agent Triggers
- Alert when production schedule violates allergen segregation rules
- Notify QA when changeover cleaning verification fails (ATP or allergen test)
- Escalate when allergen-containing ingredient is received without proper documentation
- Generate monthly allergen management report (near misses, test failures, corrective actions)`
      }
    ]
  },
  {
    id: "automotive",
    label: "Automotive Manufacturing",
    description: "Templates for assembly line optimization, quality control, and just-in-time production",
    templates: [
      {
        id: "auto-jit-sequencing",
        title: "Just-In-Time Assembly Sequencing",
        scenario: "Coordinate supplier deliveries with assembly line build sequence to minimize inventory",
        agentId: "production_scheduling",
        category: "JIT Production",
        description: "Optimizes component delivery timing to match assembly sequence and reduce work-in-process inventory",
        useCases: [
          "Seat delivery sequencing",
          "Engine and transmission JIT",
          "Paint color sequencing",
          "Trim variant coordination"
        ],
        content: `# Just-In-Time Assembly Sequencing

## Objective
Synchronize component delivery with vehicle build sequence to minimize inventory while maintaining production flow.

## JIT Sequencing Overview
- **Build Sequence Freeze**: Lock production sequence 2-4 hours before line start
- **Supplier Call-Off**: Trigger component delivery based on frozen sequence
- **Line-Side Delivery**: Parts arrive in exact build order directly to point-of-use
- **Zero Defect Quality**: No inspection buffer, so suppliers must deliver perfect quality

## Key Components for JIT Sequencing

### Seats (Highest Complexity)
- **Lead Time**: 2-3 hours from sequence release
- **Delivery Window**: ±15 minutes of required line position
- **Buffer**: Maximum 2 sets on line at any time
- **Variants**: Color, material, heating/cooling, trim level

### Engines & Transmissions
- **Lead Time**: 4-6 hours (if sequenced from supplier)
- **Delivery**: Delivered in dollies matching build sequence
- **Storage**: Minimal line-side buffer (3-5 units)
- **Complexity**: Engine type, displacement, transmission pairing

### Paint-to-Trim Sequencing
- **Challenge**: Paint booth queue time is variable
- **Solution**: RFID tracking of body-in-white through paint
- **Buffer**: Paint bank holds 20-30 painted bodies to absorb variability
- **Communication**: Painted body exit triggers trim component delivery

## Supplier Communication Protocol
**Sequence Broadcast**:
- EDI transmission of frozen build sequence to all JIT suppliers
- Includes: VIN, vehicle model, color, option codes, required delivery time
- Update frequency: Continuous for changes due to line stops/quality holds

**Call-Off Signals**:
- Automated call-off based on production progress (line speed, actual build time)
- Manual override capability for line stoppages or quality issues
- Supplier acknowledgment required within 15 minutes

## Line-Side Delivery & Kanban
- Tugger trains deliver components to specific line stations every 30-60 minutes
- Kanban cards or electronic signals trigger replenishment
- Empty container return confirms consumption (visual management)
- Standardized container sizes to simplify material handling

## Managing Variability
### Line Stops/Downtime
- Immediately notify all JIT suppliers of stoppage duration
- Pause delivery call-offs to prevent inventory buildup
- Resume with updated timing once line restarts

### Sequence Changes
- Allow limited sequence swaps within frozen window (emergency only)
- Communicate changes to affected suppliers immediately
- Track sequence changes to identify root causes (quality, parts shortage)

### Quality Holds
- If defect found, pull affected vehicle(s) from sequence
- Notify suppliers to skip that build position
- Insert rework vehicles back into sequence once repaired

## Performance Metrics
- **On-Time Delivery**: Target >98% within ±15 minute window
- **Inventory Turns**: Target >50 turns/year for JIT components
- **Line Stops Due to Parts Shortage**: Target <1 per week
- **Sequence Adherence**: Target >95% build-to-sequence match

## Agent Triggers
- Alert when supplier delivery is running late (risk of line stop)
- Notify production planning when line speed deviates from plan by >10%
- Escalate when parts shortage causes line stop or sequence break
- Generate daily JIT performance report (delivery accuracy, inventory levels)`
      }
    ]
  },
  {
    id: "aerospace",
    label: "Aerospace & Defense",
    description: "Templates for quality assurance, traceability, and regulatory compliance (AS9100)",
    templates: [
      {
        id: "aero-fai-inspection",
        title: "First Article Inspection (FAI) Protocol",
        scenario: "Complete first article inspection per AS9102 for new aerospace parts",
        agentId: "quality_management",
        category: "Quality Assurance",
        description: "Manages FAI process to verify new parts meet all engineering specifications before production release",
        useCases: [
          "New part qualification",
          "Engineering change verification",
          "Supplier FAI review",
          "AS9102 documentation"
        ],
        content: `# First Article Inspection (FAI) Protocol

## Objective
Verify that new aerospace parts or assemblies conform to all engineering and quality requirements before production release.

## When FAI is Required (Per AS9102)
1. **Initial Production**: First production run of a new part number
2. **Engineering Change**: After design change affecting form, fit, or function
3. **Process Change**: New manufacturing process, tooling, or facility
4. **Supplier Change**: New supplier or change of supplier location
5. **Lapse in Production**: After production break >2 years
6. **Customer Request**: When specified on purchase order or contract

## FAI Documentation Requirements (AS9102 Forms)
**Form 1 - Part Number Accountability**:
- Part number, revision level, serial number
- Applicable engineering drawings and specifications
- List of all characteristics requiring verification

**Form 2 - Product Accountability (if applicable)**:
- For kitted assemblies with multiple components
- Linkage to individual component FAIs

**Form 3 - Characteristic Accountability**:
- Detailed inspection results for every characteristic
- Actual measured values with tolerances
- Inspection method and equipment used
- Inspector name and date

**Form 4 - Supplier Accountability**:
- Raw material certifications
- Special process certifications (heat treat, plating, NDT)
- Sub-tier supplier FAI reports (flow-down requirements)

## Inspection Planning
1. **Review Engineering Data Package**: Drawings, specifications, material certs
2. **Identify Critical Characteristics**: Focus on safety-critical and key product features
3. **Select Inspection Methods**: CMM, optical comparator, functional testing
4. **Calibrate Equipment**: Ensure all measurement tools are within calibration
5. **Assign Qualified Inspector**: Level II or higher per AS9102 requirements

## Inspection Execution
- **100% Inspection**: Every dimension and characteristic on drawing must be verified
- **Documented Evidence**: Photos, CMM reports, functional test data
- **Non-Conformances**: Any discrepancy must be documented and dispositioned (rework, scrap, or engineering concession)
- **Traceability**: Maintain serial number traceability through all manufacturing operations

## FAI Review & Approval
**Internal Review**:
1. Quality Engineer reviews all Forms 1-4 for completeness and accuracy
2. Engineering reviews for compliance with design intent
3. Quality Manager approves FAI package before customer submittal

**Customer Review**:
- Submit complete FAI package to customer (forms + supporting data)
- Customer may request additional testing or witness inspection
- Obtain customer approval signature before production release

## Production Release
- FAI approval does not automatically release production
- First production lot may require additional sampling (PPAP, lot acceptance)
- Maintain FAI records for life of part number (minimum 10 years for aerospace)

## FAI Database Management
- Maintain centralized FAI database with revision control
- Track FAI status for all active part numbers
- Flag parts requiring re-FAI due to process changes

## Agent Triggers
- Alert when new part number is released to production without approved FAI
- Notify when engineering change requires re-FAI
- Escalate when FAI is overdue (>30 days from initial sample)
- Generate monthly FAI status report (pending, approved, rejected)`
      }
    ]
  },
  {
    id: "electronics",
    label: "Electronics Manufacturing",
    description: "Templates for PCB assembly, SMT optimization, and electrostatic discharge (ESD) control",
    templates: [
      {
        id: "elec-smt-optimization",
        title: "SMT Line Optimization & Defect Reduction",
        scenario: "Optimize surface mount technology (SMT) pick-and-place operations to reduce defects and improve throughput",
        agentId: "production_scheduling",
        category: "Process Optimization",
        description: "Optimizes SMT assembly line performance to maximize throughput while minimizing placement defects",
        useCases: [
          "Placement accuracy optimization",
          "Changeover time reduction",
          "Solder paste printing quality",
          "Reflow oven profiling"
        ],
        content: `# SMT Line Optimization & Defect Reduction

## Objective
Maximize SMT assembly throughput while achieving <50 PPM defect rate for placement and soldering.

## Key Performance Indicators
- **First Pass Yield (FPY)**: Target >98% after reflow (before rework)
- **Placement Accuracy**: ±0.025mm for fine-pitch components (0.4mm pitch)
- **Throughput (UPH)**: Units per hour based on placement time + changeover
- **Solder Joint Quality**: IPC Class 2 or Class 3 per customer requirements

## Solder Paste Printing Process
**Critical Parameters**:
- Stencil thickness: 0.004"-0.006" for standard pitch, 0.003" for fine pitch
- Squeegee pressure: 5-10 lbs for metal blades
- Print speed: 1-2 inches/second
- Separation speed: <0.5 inch/second to prevent paste pulling

**Inspection**:
- Solder Paste Inspection (SPI) system after every print
- Measure paste volume, height, and area for critical pads
- Automatic board reject if paste outside tolerance (±20% of target)

**Maintenance**:
- Under-stencil wipe every 5-10 prints (or as needed based on SPI data)
- Replace solder paste every 4 hours or when rheology degrades
- Stencil cleaning at end of shift (ultrasonic cleaner)

## Pick-and-Place Optimization
**Feeder Setup**:
- Organize component feeders to minimize placement head travel distance
- Group similar component types together (resistors, capacitors, ICs)
- Use gang feeders for high-volume passive components
- Ensure proper feeder calibration (pitch, component angle)

**Placement Program Optimization**:
- Optimize placement sequence to reduce head movement (shortest path)
- Enable simultaneous dual-head placement where possible
- Use vision alignment for fine-pitch components (QFP, BGA)
- Set appropriate placement force and speed (prevent component damage)

**Nozzle Selection**:
- Match nozzle size to component package (avoid using oversized nozzles)
- Maintain nozzle cleanliness (vacuum and contact surface)
- Replace worn nozzles when placement accuracy degrades

## Reflow Oven Profiling
**Zone Temperature Settings** (for SAC305 lead-free solder):
1. Preheat zone: 150-180°C (gradual ramp, 1-3°C/sec)
2. Soak zone: 180-200°C (activate flux, remove volatiles)
3. Reflow zone: Peak 240-250°C (30-60 seconds above liquidus)
4. Cooling zone: <6°C/sec cooling rate (prevent thermal shock)

**Profile Verification**:
- Use thermocouple-equipped test board monthly
- Verify all components reach minimum reflow temperature
- Check for excessive Delta-T across large components (<100°C)

## Automated Optical Inspection (AOI)
- Inspect 100% of boards after reflow
- Program AOI to detect: missing components, wrong polarity, solder bridges, insufficient solder
- Review and classify false calls daily to tune AOI algorithms
- Generate Pareto chart of top defect types for continuous improvement

## Defect Root Cause Analysis
**Common Defects & Causes**:
- **Tombstoning**: Uneven heating, solder paste imbalance
- **Solder Bridges**: Excessive solder paste, poor stencil design
- **Insufficient Solder**: Under-printing, poor wetting, contamination
- **Component Shift**: Excessive placement force, reflow vibration

**Corrective Actions**:
1. Identify defect type and affected components
2. Review process data (SPI, placement vision, reflow profile)
3. Implement corrective action (adjust paste print, re-profile oven, etc.)
4. Verify effectiveness with follow-up boards

## Agent Triggers
- Alert when SPI detects paste printing out of tolerance
- Notify when placement accuracy drifts >50% of tolerance
- Escalate when FPY drops below 95% (immediate investigation required)
- Generate shift performance report (throughput, FPY, top defects)`
      }
    ]
  },
  {
    id: "consumer-goods",
    label: "Consumer Goods",
    description: "Templates for high-volume production, packaging automation, and demand-driven scheduling",
    templates: [
      {
        id: "consumer-demand-sensing",
        title: "Real-Time Demand Sensing for Consumer Products",
        scenario: "Use real-time POS data and market signals to adjust production and inventory levels",
        agentId: "demand_management",
        category: "Demand Planning",
        description: "Leverages real-time sales data and market signals to dynamically adjust demand forecasts and production plans",
        useCases: [
          "Promotional demand planning",
          "Product launch forecasting",
          "Seasonal demand shifts",
          "Competitive response planning"
        ],
        content: `# Real-Time Demand Sensing for Consumer Products

## Objective
Rapidly detect demand shifts and adjust production/inventory to minimize stockouts and excess inventory.

## Data Sources for Demand Sensing
### Point-of-Sale (POS) Data
- Daily retail sales by SKU and store location
- Inventory levels at retail (sell-through vs. inventory turns)
- Promotional effectiveness (lift during promo periods)
- New product launch velocity

### Market Signals
- Social media sentiment and trending topics
- Competitor product launches and pricing changes
- Weather patterns affecting seasonal demand
- Economic indicators (consumer confidence, unemployment)

### Supply Chain Data
- Distributor order patterns and inventory positions
- Manufacturing lead times and capacity utilization
- Raw material availability and supplier constraints

## Demand Sensing Methodology
**Short-Cycle Forecasting (Weekly)**:
- Use machine learning to detect demand patterns from recent POS data
- Weight recent actuals more heavily than historical trends
- Adjust baseline forecast by demand sensing signal (typically ±10-30%)

**Promotional Forecasting**:
- Historical promotional lift factors by product/channel
- Adjustments for promotional mechanics (BOGO, % off, bundling)
- Competitive promotional activity during same period

**New Product Forecasting**:
- Analogous product analysis (performance of similar past launches)
- Pre-launch market research and test market results
- Launch plan investment (advertising, trade promotions, distribution)

## Production Planning Integration
**Flexible Capacity Allocation**:
- Maintain swing capacity to respond to demand surges (10-20% buffer)
- Prioritize production of high-velocity SKUs during constrained capacity
- Use contract manufacturing (co-packers) for surge demand

**Dynamic Inventory Targets**:
- Increase safety stock for high-volatility items (CV >30%)
- Reduce inventory for slow-moving SKUs (turn obsolete stock into promotions)
- Strategic pre-builds ahead of seasonal peaks (summer, holidays)

**Rapid Changeover Capability**:
- Reduce changeover time to enable smaller batch sizes and more flexibility
- Quick-change tooling and SMED (Single-Minute Exchange of Die) techniques
- Cellular manufacturing to co-locate similar products

## Collaborative Planning with Retailers
**Joint Business Planning (JBP)**:
- Monthly meetings with key retail partners to align on demand forecast
- Share promotional calendar and new product launch plans
- Coordinate inventory levels to avoid stockouts during promotions

**Vendor-Managed Inventory (VMI)**:
- Supplier monitors retail inventory and triggers replenishment automatically
- Reduces bullwhip effect (order variability amplification)
- Requires strong retailer trust and data sharing

## Performance Metrics
- **Forecast Accuracy**: MAPE <15% at SKU level
- **Demand Sensing Accuracy**: Improvement vs. baseline statistical forecast
- **Service Level**: >98% in-stock at retail (no lost sales)
- **Inventory Days of Supply**: <30 days finished goods, <45 days total

## Agent Triggers
- Alert when POS sell-through drops >20% vs. forecast (investigate immediately)
- Notify when competitor launches new product in same category
- Escalate when stockout risk >10% for top 20% SKUs (revenue ABC analysis)
- Generate weekly demand sensing report with recommended production adjustments`
      }
    ]
  }
];
