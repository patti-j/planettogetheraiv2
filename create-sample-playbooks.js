#!/usr/bin/env node

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const samplePlaybooks = [
  {
    title: "Scheduling Preferences for Phoenix Brewery Plant",
    description: "Comprehensive scheduling guidelines and preferences for Phoenix Brewery operations, including resource allocation, shift patterns, and optimization strategies.",
    tags: ["scheduling", "phoenix-plant", "brewery", "optimization", "shifts"],
    category: "production",
    content: `# Scheduling Preferences for Phoenix Brewery Plant

## Overview
This playbook contains detailed scheduling preferences and operational guidelines for Phoenix Brewery Plant operations.

## Resource Allocation Strategy
- **Primary Brewing Lines**: Allocate Brew Kettle 1 and 2 for high-volume production (Newcastle Brown Ale, IPA batches)
- **Specialty Equipment**: Reserve Fermentation Tank 3 for experimental batches and seasonal varieties
- **Packaging Lines**: Line A for bottles, Line B for cans, coordinate to minimize changeovers

## Shift Patterns
- **Day Shift (6:00-14:00)**: Primary production operations, quality control testing
- **Evening Shift (14:00-22:00)**: Packaging operations, equipment maintenance
- **Night Shift (22:00-6:00)**: Cleaning cycles, fermentation monitoring, minimal production

## Optimization Rules
1. **Batch Sequencing**: Schedule similar beer styles consecutively to reduce cleaning time
2. **Resource Utilization**: Maintain 85% average capacity utilization during peak hours
3. **Quality Gates**: Allow 30-minute quality check buffers between critical operations
4. **Maintenance Windows**: Schedule preventive maintenance during low-demand periods (Tuesday-Wednesday nights)

## Bottleneck Management
- **Primary Bottleneck**: Fermentation capacity - schedule ahead 14 days minimum
- **Secondary Bottleneck**: Packaging equipment - coordinate with demand forecasts
- **Contingency**: Keep 10% buffer capacity for urgent orders

## Key Contacts
- Production Manager: Sarah Johnson (ext. 2234)
- Quality Control: Mike Chen (ext. 2156)
- Maintenance Lead: Carlos Rodriguez (ext. 2298)

## Last Updated: August 2025`
  },
  
  {
    title: "Quality Control Standards for Pharmaceutical Manufacturing",
    description: "Comprehensive quality control procedures, testing protocols, and compliance requirements for pharmaceutical production environments.",
    tags: ["quality-control", "pharmaceutical", "compliance", "testing", "GMP"],
    category: "quality",
    content: `# Quality Control Standards for Pharmaceutical Manufacturing

## Overview
This playbook defines quality control standards and procedures for pharmaceutical manufacturing operations in compliance with FDA and GMP regulations.

## Testing Protocols
### Raw Material Testing
- **Identity Testing**: HPLC analysis for all active pharmaceutical ingredients (APIs)
- **Purity Analysis**: Minimum 99.5% purity required for critical components  
- **Microbial Testing**: Total aerobic count <1000 CFU/g, no pathogenic organisms
- **Moisture Content**: <0.5% for hygroscopic materials

### In-Process Testing
- **Blend Uniformity**: Sample 10 locations per batch, RSD <6%
- **Tablet Hardness**: 4-8 kg force, test every 30 minutes during compression
- **Weight Variation**: ±5% for tablets >80mg, ±7.5% for tablets <80mg
- **Dissolution Rate**: 85% minimum in 30 minutes for immediate release

### Finished Product Testing
- **Assay**: 95-105% of labeled amount for active ingredients
- **Impurities**: Individual impurities <0.5%, total impurities <2%
- **Stability**: Accelerated testing at 40°C/75% RH for 6 months
- **Packaging Integrity**: Moisture barrier testing, seal strength validation

## Environmental Monitoring
- **Clean Room Classification**: ISO 7 minimum for manufacturing areas
- **Particle Counts**: Monitor continuously, alert if >10,500 particles/m³ (≥0.5μm)
- **Microbial Limits**: <100 CFU/m³ in Grade A/B areas
- **Temperature/Humidity**: 20-24°C, 45-65% RH with ±2°C/±5% control

## Documentation Requirements
- **Batch Records**: Complete within 24 hours of batch completion
- **Test Results**: All data reviewed and approved by QC Manager
- **Deviations**: Investigate within 48 hours, CAPA within 30 days
- **Change Control**: Risk assessment required for any process changes

## Equipment Qualification
- **Installation Qualification (IQ)**: Verify equipment installation per specifications
- **Operational Qualification (OQ)**: Confirm equipment operates within design parameters
- **Performance Qualification (PQ)**: Validate process performance over extended periods
- **Requalification**: Annual reviews, full requalification every 3 years

## Key Performance Indicators
- **First Pass Yield**: Target >95% for all manufacturing processes
- **Right First Time**: >98% for batch documentation accuracy
- **Customer Complaints**: <1 per 100,000 units shipped
- **Audit Findings**: Zero critical findings, <5 major findings per year

## Training Requirements
- **GMP Training**: Annual certification for all manufacturing personnel
- **Equipment Training**: Specific qualification for each piece of equipment operated
- **Quality Systems**: Biannual updates on quality procedures and regulations
- **Emergency Procedures**: Quarterly drills for contamination and recall scenarios

## Last Updated: August 2025`
  },

  {
    title: "Predictive Maintenance Strategy for Industrial Equipment",
    description: "Data-driven maintenance approach using IoT sensors, vibration analysis, and machine learning algorithms to prevent equipment failures and optimize maintenance schedules.",
    tags: ["predictive-maintenance", "IoT", "vibration-analysis", "machine-learning", "equipment"],
    category: "maintenance",
    content: `# Predictive Maintenance Strategy for Industrial Equipment

## Overview
This playbook outlines the comprehensive predictive maintenance strategy using advanced analytics, IoT sensors, and condition monitoring to maximize equipment reliability and minimize unplanned downtime.

## Sensor Installation & Monitoring
### Critical Equipment Monitoring
- **Rotating Equipment**: Vibration sensors on motors, pumps, compressors, fans
- **Thermal Monitoring**: Infrared sensors on electrical panels, bearings, heat exchangers
- **Pressure Systems**: Pressure transducers on hydraulic and pneumatic systems
- **Flow Monitoring**: Ultrasonic flow meters on critical process lines

### Data Collection Parameters
- **Vibration Analysis**: Overall velocity, acceleration, frequency spectrum analysis
- **Temperature Trends**: Baseline ±5°C normal, >15°C increase triggers investigation
- **Oil Analysis**: Wear particle count, viscosity, acid number, water content
- **Electrical Monitoring**: Current signature analysis, power quality assessment

## Condition-Based Thresholds
### Alert Levels
- **Green Zone**: Normal operation, routine monitoring
- **Yellow Zone**: Increased monitoring frequency, plan maintenance within 30 days
- **Orange Zone**: Schedule maintenance within 7 days, increase inspection frequency
- **Red Zone**: Immediate shutdown required, emergency maintenance protocol

### Equipment-Specific Thresholds
#### Centrifugal Pumps
- Vibration: <2.5 mm/s (Green), 2.5-7 mm/s (Yellow), 7-18 mm/s (Orange), >18 mm/s (Red)
- Temperature: <80°C (Green), 80-100°C (Yellow), 100-120°C (Orange), >120°C (Red)
- Flow Rate: >90% rated (Green), 80-90% (Yellow), 70-80% (Orange), <70% (Red)

#### Electric Motors
- Current Signature: Normal spectrum (Green), 2x line frequency (Yellow), Multiple harmonics (Orange), Severe distortion (Red)
- Bearing Temperature: <85°C (Green), 85-105°C (Yellow), 105-125°C (Orange), >125°C (Red)
- Insulation Resistance: >1000MΩ (Green), 100-1000MΩ (Yellow), 10-100MΩ (Orange), <10MΩ (Red)

## Machine Learning Models
### Failure Prediction Algorithms
- **Random Forest**: Primary model for multi-parameter failure prediction
- **Neural Networks**: Deep learning for complex pattern recognition
- **Time Series Analysis**: ARIMA models for trending and forecasting
- **Anomaly Detection**: Isolation Forest for identifying unusual patterns

### Model Training Data
- **Historical Failures**: Minimum 2 years of failure data for each equipment type
- **Sensor Data**: High-frequency data (1Hz-1kHz) depending on application
- **Maintenance Records**: Detailed work orders, parts replaced, root causes
- **Operating Conditions**: Production rates, environmental conditions, load variations

## Maintenance Scheduling Optimization
### Priority Matrix
- **Criticality Assessment**: Production impact, safety risk, replacement cost
- **Condition Score**: Real-time health index based on sensor data
- **Resource Availability**: Technician skills, spare parts inventory, maintenance windows
- **Business Impact**: Production schedule, customer commitments, financial implications

### Maintenance Types
1. **Predictive**: Based on condition monitoring and analytics (60% of activities)
2. **Preventive**: Time-based maintenance for non-monitored equipment (25% of activities)
3. **Corrective**: Planned repairs based on inspections (10% of activities)
4. **Emergency**: Unplanned failures requiring immediate attention (<5% of activities)

## Implementation Phases
### Phase 1 (Months 1-3): Foundation
- Install sensors on top 20 critical equipment pieces
- Establish data collection infrastructure and dashboards
- Train maintenance team on condition monitoring basics
- Define alert thresholds and escalation procedures

### Phase 2 (Months 4-8): Analytics
- Deploy machine learning models for failure prediction
- Integrate with CMMS for automated work order generation
- Expand sensor network to secondary equipment
- Develop mobile apps for field technician data collection

### Phase 3 (Months 9-12): Optimization
- Implement advanced analytics and optimization algorithms
- Deploy augmented reality for guided maintenance procedures
- Establish supplier partnerships for condition-based parts ordering
- Achieve target KPIs and continuous improvement processes

## Key Performance Indicators
- **Overall Equipment Effectiveness (OEE)**: Target >85% (currently 78%)
- **Mean Time Between Failures (MTBF)**: Increase by 40% within 12 months
- **Maintenance Costs**: Reduce by 15% while improving reliability
- **Unplanned Downtime**: Reduce from 8% to <3% of total operating time
- **Spare Parts Inventory**: Optimize stock levels, reduce carrying costs by 20%

## Technology Stack
- **IoT Platform**: Industrial IoT gateway with edge computing capabilities
- **Data Analytics**: Apache Spark for big data processing, Python for ML models
- **Visualization**: Grafana dashboards for real-time monitoring
- **CMMS Integration**: SAP PM or Maximo for work order management
- **Mobile Apps**: Native iOS/Android apps for field data collection

## Last Updated: August 2025`
  },

  {
    title: "Supply Chain Optimization for Automotive Parts",
    description: "Strategic approach to optimizing automotive parts supply chain including supplier management, inventory optimization, logistics coordination, and risk mitigation strategies.",
    tags: ["supply-chain", "automotive", "inventory-optimization", "supplier-management", "logistics"],
    category: "supply_chain",
    content: `# Supply Chain Optimization for Automotive Parts

## Overview
This playbook provides comprehensive guidelines for optimizing automotive parts supply chain operations, focusing on cost reduction, quality improvement, and delivery reliability while maintaining flexibility for demand fluctuations.

## Supplier Management Strategy
### Tier 1 Suppliers (Critical Components)
- **Engine Components**: 3 qualified suppliers minimum, dual sourcing for critical parts
- **Safety Systems**: Single source with backup qualification, rigorous audit program
- **Electronics**: Technology partnerships with long-term agreements (3-5 years)
- **Powertrain**: Strategic alliances with co-development agreements

### Supplier Performance Metrics
- **Quality**: PPM defect rate <100, Zero tolerance for safety-related defects
- **Delivery**: On-time delivery >98%, Schedule adherence index >95%
- **Cost**: Annual cost reduction target 3-5%, Total cost of ownership optimization
- **Innovation**: New product introduction support, Technology roadmap alignment

### Supplier Development Program
- **Capability Assessment**: Annual supplier audits using standardized scorecard
- **Continuous Improvement**: Kaizen events, Six Sigma projects, Best practice sharing
- **Training Programs**: Quality systems, lean manufacturing, digital transformation
- **Financial Health Monitoring**: Quarterly financial stability assessments

## Inventory Optimization
### ABC Analysis Classification
- **A-Items (20% items, 80% value)**: Daily monitoring, safety stock 3-5 days
- **B-Items (30% items, 15% value)**: Weekly review, safety stock 5-10 days  
- **C-Items (50% items, 5% value)**: Monthly review, safety stock 15-30 days

### Just-In-Time (JIT) Implementation
- **Pull System**: Kanban cards for production scheduling, supplier integration
- **Milk Runs**: Consolidated pickup routes, optimal delivery frequencies
- **Supplier Parks**: Co-located suppliers for reduced transportation time
- **Synchronous Supply**: Direct-to-line delivery for bulky components

### Safety Stock Optimization
- **Demand Variability**: Historical analysis with seasonal adjustments
- **Lead Time Variability**: Supplier performance data, transportation delays
- **Service Level Targets**: 99.5% for A-items, 98% for B-items, 95% for C-items
- **Dynamic Adjustment**: Monthly recalculation based on actual performance

## Logistics Coordination
### Transportation Management
- **Mode Selection**: Optimize between air, ocean, ground based on urgency/cost
- **Carrier Management**: Performance scorecards, capacity agreements, backup options
- **Route Optimization**: AI-powered routing for milk runs and emergency shipments
- **Cross-Docking**: Regional distribution centers for faster delivery

### Warehouse Operations
- **Layout Optimization**: Fast-moving items near shipping, bulk storage optimization
- **Picking Strategies**: Zone picking for high-volume, batch picking for efficiency  
- **Automation**: Automated storage/retrieval systems, AGVs for material movement
- **Quality Control**: Incoming inspection, quarantine areas, damage prevention

## Risk Mitigation Strategies
### Supply Risk Assessment
- **Supplier Risk Matrix**: Financial stability, geographic concentration, technology dependency
- **Single Source Risk**: Identify and mitigate single-source dependencies
- **Geographic Risk**: Natural disasters, political instability, trade regulations
- **Cyber Security**: Supplier IT security requirements, data protection protocols

### Business Continuity Planning
- **Alternative Suppliers**: Pre-qualified backup suppliers for critical components
- **Emergency Inventory**: Strategic safety stock for high-risk scenarios
- **Rapid Response Team**: Cross-functional team for supply disruption management
- **Communication Protocols**: Escalation procedures, stakeholder notifications

## Digital Transformation Initiatives
### Supply Chain Visibility
- **Real-Time Tracking**: IoT sensors for shipment monitoring, GPS tracking
- **Supplier Portal**: Web-based platform for order management, performance tracking
- **Predictive Analytics**: Demand forecasting, supplier risk prediction
- **Control Tower**: Centralized monitoring dashboard for end-to-end visibility

### Technology Integration
- **ERP Integration**: SAP/Oracle integration for seamless data flow
- **EDI/API Connectivity**: Automated data exchange with suppliers/logistics providers
- **Blockchain**: Pilot program for parts traceability and authenticity verification
- **AI/ML Applications**: Demand sensing, dynamic pricing, anomaly detection

## Cost Management
### Total Cost of Ownership (TCO)
- **Purchase Price**: Direct material costs, tooling, development costs
- **Quality Costs**: Inspection, rework, warranty, customer returns
- **Delivery Costs**: Transportation, warehousing, expediting, inventory carrying
- **Service Costs**: Supplier management, communication, transaction processing

### Cost Reduction Initiatives
- **Value Engineering**: Design for manufacturability, material substitution
- **Global Sourcing**: Low-cost country sourcing with quality assurance
- **Volume Leverage**: Consolidated purchasing, long-term agreements
- **Process Improvement**: Supplier kaizen events, waste elimination

## Performance Metrics & KPIs
### Operational Metrics
- **Fill Rate**: 99% target for production line support
- **Inventory Turns**: 12x annually for fast-moving parts, 6x for slow-moving
- **Order Cycle Time**: 48 hours for standard orders, 24 hours for urgent
- **Cost Per Transaction**: Reduce by 10% annually through automation

### Financial Metrics
- **Inventory Investment**: Optimize to 45 days of sales outstanding
- **Cost Avoidance**: Track supplier cost reduction initiatives ($M annually)
- **Working Capital**: Improve cash-to-cash cycle by 15% over 2 years
- **Supply Chain Costs**: Maintain <8% of revenue while improving service

### Quality & Risk Metrics
- **Supplier Quality Rating**: Maintain >95% acceptable rating across supplier base
- **Supply Disruptions**: <5 critical disruptions per year affecting production
- **Risk Exposure**: Quantify and monitor supplier financial/operational risks
- **Compliance Score**: 100% adherence to automotive industry standards (IATF 16949)

## Continuous Improvement Framework
- **Monthly Reviews**: Supplier performance, inventory levels, cost trends
- **Quarterly Business Reviews**: Strategic supplier meetings, relationship management
- **Annual Strategy Sessions**: Supply chain strategy alignment, technology roadmap
- **Benchmarking Studies**: Industry best practices, competitive analysis

## Last Updated: August 2025`
  },

  {
    title: "Energy Management for Manufacturing Facilities",
    description: "Comprehensive energy management strategy focusing on consumption monitoring, efficiency improvements, renewable energy integration, and cost optimization for manufacturing operations.",
    tags: ["energy-management", "manufacturing", "efficiency", "renewable-energy", "sustainability"],
    category: "operations",
    content: `# Energy Management for Manufacturing Facilities

## Overview
This playbook outlines comprehensive energy management strategies for manufacturing facilities to optimize energy consumption, reduce costs, improve sustainability, and ensure reliable operations while maintaining production quality and safety standards.

## Energy Consumption Monitoring
### Real-Time Monitoring Systems
- **Smart Meters**: Install at main distribution panels and major equipment
- **Sub-Metering**: Individual monitoring for HVAC, lighting, compressed air, production equipment
- **Data Collection**: 15-minute intervals minimum, 1-minute for critical loads
- **Dashboard Integration**: Real-time visualization with alerting capabilities

### Key Metrics Tracking
- **Energy Intensity**: kWh per unit of production output
- **Peak Demand**: 15-minute rolling average, demand charges optimization  
- **Power Factor**: Maintain >0.95 to avoid utility penalties
- **Load Profile**: Identify patterns, peak shaving opportunities

### Baseline Establishment
- **Historical Analysis**: Minimum 12 months of consumption data
- **Weather Normalization**: Adjust for heating/cooling degree days
- **Production Correlation**: Energy use per unit produced by product line
- **Benchmarking**: Compare against industry standards and best practices

## Energy Efficiency Improvements
### HVAC Systems Optimization
- **Setpoint Optimization**: Widen deadbands during unoccupied hours
- **Variable Speed Drives**: Install on large fans, pumps, compressors
- **Economizer Operation**: Free cooling when outdoor conditions permit
- **Preventive Maintenance**: Regular filter changes, coil cleaning, calibration

### Lighting Upgrades
- **LED Conversion**: Replace all fluorescent and HID fixtures
- **Occupancy Sensors**: Install in offices, break rooms, storage areas
- **Daylight Harvesting**: Automated dimming based on natural light levels
- **Task Lighting**: Reduce general lighting, increase targeted lighting

### Compressed Air System
- **Right-Sizing**: Match compressor capacity to actual demand
- **Leak Detection**: Weekly ultrasonic leak detection, immediate repairs
- **Pressure Optimization**: Reduce system pressure to minimum required
- **Heat Recovery**: Capture compressor waste heat for space heating

### Motor Efficiency Programs
- **Premium Efficiency Motors**: NEMA Premium or IE3 minimum for new installations
- **Variable Speed Drives**: Install on pumps, fans, conveyors where applicable
- **Motor Management**: Track motor inventory, plan replacements proactively
- **Power Quality**: Minimize voltage imbalances, harmonics, phase issues

## Renewable Energy Integration
### Solar Photovoltaic (PV) Systems
- **Rooftop Assessment**: Structural analysis, shading studies, available space
- **Ground-Mount Options**: Parking lot canopies, unused land areas
- **System Sizing**: Match to daytime consumption patterns, consider battery storage
- **Financial Analysis**: ROI calculation including incentives, net metering

### Wind Energy Opportunities
- **Site Assessment**: Wind resource analysis, zoning requirements
- **Micro Wind**: Small turbines for supplemental power generation
- **Power Purchase Agreements**: Off-site wind farm contracts
- **Grid Integration**: Power quality considerations, interconnection requirements

### Energy Storage Systems
- **Battery Storage**: Lithium-ion systems for peak shaving, demand management
- **Thermal Storage**: Ice storage for cooling, hot water tanks for heating
- **Operational Strategies**: Time-of-use optimization, emergency backup power
- **Grid Services**: Participation in demand response programs

## Demand Response Programs
### Utility Programs Participation
- **Peak Shaving**: Reduce consumption during utility peak periods
- **Load Shifting**: Move non-critical operations to off-peak hours
- **Emergency Response**: Curtailable loads during grid emergencies
- **Economic Incentives**: Capacity payments, energy bill reductions

### Automated Demand Response (ADR)
- **Smart Controls**: Automated response to utility signals
- **Load Prioritization**: Critical vs. non-critical load identification
- **Response Testing**: Regular drills to verify system capabilities
- **Performance Tracking**: Measure response accuracy, financial benefits

## Energy Cost Optimization
### Utility Rate Analysis
- **Time-of-Use Rates**: Optimize operations around rate structures
- **Demand Charges**: Peak demand management strategies
- **Power Factor Penalties**: Maintain optimal power factor levels
- **Alternative Suppliers**: Evaluate deregulated market options

### Energy Procurement Strategies
- **Fixed vs. Variable Pricing**: Risk assessment for contract structures
- **Contract Terms**: Duration, volume commitments, exit clauses
- **Market Analysis**: Monitor energy commodity prices, trends
- **Professional Support**: Energy broker or consultant engagement

## Sustainability Reporting
### Carbon Footprint Tracking
- **Scope 1 Emissions**: Direct combustion, process emissions
- **Scope 2 Emissions**: Purchased electricity, steam, cooling
- **Emission Factors**: Use EPA eGRID factors for regional grid emissions
- **Reduction Targets**: Science-based targets, net-zero commitments

### Environmental Certifications
- **ISO 50001**: Energy management system certification
- **LEED**: Building certification for new construction/renovations
- **ENERGY STAR**: EPA certification for industrial facilities
- **Carbon Disclosure**: CDP reporting, sustainability indices

## Implementation Roadmap
### Phase 1 (Months 1-6): Foundation
- Install comprehensive metering and monitoring systems
- Establish energy baselines and key performance indicators
- Conduct facility energy audits and identify quick wins
- Implement no-cost/low-cost efficiency measures

### Phase 2 (Months 7-18): Major Projects
- Execute capital efficiency projects (lighting, HVAC, motors)
- Implement energy management system (ISO 50001)
- Explore renewable energy options and financing
- Participate in utility demand response programs

### Phase 3 (Months 19-24): Optimization
- Install renewable energy systems (solar, wind, storage)
- Achieve advanced certifications and sustainability goals
- Implement predictive maintenance for energy systems
- Establish continuous improvement culture

## Key Performance Indicators
### Energy Performance
- **Energy Intensity Reduction**: 15% improvement over 3 years
- **Peak Demand Management**: 10% reduction in coincident peak
- **Power Factor Improvement**: Maintain >0.95 across all facilities
- **Energy Cost per Unit**: Track against production volumes

### Financial Performance
- **Energy Cost Savings**: $500K annually through efficiency measures
- **Demand Charge Reduction**: 20% decrease through peak management
- **Renewable Energy ROI**: <7 year payback for solar installations
- **Utility Incentive Capture**: Maximize available rebates and incentives

### Environmental Performance
- **Carbon Emissions Reduction**: 25% by 2027 (baseline 2022)
- **Renewable Energy Percentage**: 30% of total consumption by 2026
- **Water Conservation**: 15% reduction through cooling system optimization
- **Waste Reduction**: Minimize energy-related waste streams

## Technology Integration
- **Building Automation Systems**: Centralized control and monitoring
- **IoT Sensors**: Wireless monitoring for remote/difficult locations
- **Machine Learning**: Predictive analytics for energy optimization
- **Mobile Apps**: Real-time monitoring, alert notifications for facility staff

## Training & Engagement
- **Energy Champion Program**: Cross-functional energy awareness team
- **Employee Training**: Monthly sessions on energy conservation practices
- **Performance Feedback**: Regular communication of energy performance results
- **Incentive Programs**: Recognition and rewards for energy-saving suggestions

## Last Updated: August 2025`
  },

  {
    title: "Digital Transformation Roadmap for Legacy Manufacturing",
    description: "Strategic plan for modernizing legacy manufacturing systems through Industry 4.0 technologies, including IoT integration, digital twins, advanced analytics, and workforce transformation.",
    tags: ["digital-transformation", "industry-4.0", "IoT", "digital-twins", "analytics", "modernization"],
    category: "technology",
    content: `# Digital Transformation Roadmap for Legacy Manufacturing

## Overview
This playbook provides a comprehensive roadmap for transforming legacy manufacturing operations through strategic implementation of Industry 4.0 technologies, focusing on operational excellence, data-driven decision making, and sustainable competitive advantage.

## Current State Assessment
### Legacy System Inventory
- **Manufacturing Execution Systems (MES)**: Evaluate current functionality, integration capabilities
- **Enterprise Resource Planning (ERP)**: Assess data quality, real-time visibility limitations
- **Human Machine Interfaces (HMI)**: Review operator interfaces, usability, mobile compatibility
- **Control Systems**: Document PLC/SCADA systems, communication protocols, cybersecurity posture

### Technology Gap Analysis
- **Connectivity**: Assess OT/IT network segregation, bandwidth requirements
- **Data Architecture**: Evaluate data silos, quality issues, accessibility
- **Analytics Capabilities**: Review current reporting, predictive analytics maturity
- **Cybersecurity**: Assess vulnerabilities, compliance with industrial security standards

### Skills Assessment
- **Technical Capabilities**: IT/OT convergence skills, data analytics competencies
- **Change Management**: Organizational readiness for digital transformation
- **Training Needs**: Identify skill gaps, develop training programs
- **Cultural Readiness**: Assess adoption barriers, change resistance

## Technology Implementation Strategy
### Phase 1: Foundation (Months 1-12)
#### Network Infrastructure
- **Industrial Ethernet**: Upgrade to gigabit Ethernet backbone
- **Wireless Coverage**: Deploy industrial Wi-Fi 6 for mobile applications
- **Network Segmentation**: Implement secure OT/IT network architecture
- **Cybersecurity**: Deploy industrial firewalls, network monitoring

#### Data Infrastructure  
- **Data Historians**: Implement high-speed data collection systems
- **Edge Computing**: Deploy edge nodes for real-time processing
- **Cloud Integration**: Establish hybrid cloud architecture
- **Data Governance**: Implement data quality, security, retention policies

#### Basic Connectivity
- **Sensor Networks**: Install temperature, pressure, vibration sensors
- **RFID/Barcode**: Implement asset tracking, inventory management
- **Machine Connectivity**: Connect critical equipment to network
- **Mobile Devices**: Deploy tablets/smartphones for operators

### Phase 2: Intelligence (Months 13-24)
#### Advanced Analytics
- **Data Lake**: Implement centralized data repository
- **Machine Learning Platform**: Deploy ML/AI development environment
- **Predictive Analytics**: Develop equipment failure prediction models
- **Quality Analytics**: Implement real-time quality monitoring

#### Digital Twins
- **Equipment Models**: Create digital replicas of critical equipment
- **Process Simulation**: Develop virtual process optimization models
- **Scenario Planning**: Enable what-if analysis capabilities
- **Optimization Algorithms**: Implement automated parameter tuning

#### Advanced Automation
- **Collaborative Robots**: Deploy cobots for human-machine collaboration
- **Computer Vision**: Implement quality inspection automation
- **Automated Material Handling**: AGVs, conveyor optimization
- **Advanced Process Control**: Model predictive control systems

### Phase 3: Autonomous Operations (Months 25-36)
#### Artificial Intelligence
- **Autonomous Quality Control**: AI-powered defect detection
- **Dynamic Scheduling**: AI-driven production optimization  
- **Supply Chain Intelligence**: Predictive demand planning
- **Maintenance Optimization**: Autonomous maintenance scheduling

#### Advanced Integration
- **End-to-End Visibility**: Real-time supply chain transparency
- **Customer Integration**: Direct customer portal integration
- **Supplier Collaboration**: Shared planning and forecasting
- **Ecosystem Orchestration**: Integrated partner networks

## IoT Integration Strategy
### Sensor Deployment Plan
- **Environmental Monitoring**: Temperature, humidity, air quality sensors
- **Asset Monitoring**: Vibration, temperature, current sensors on rotating equipment
- **Process Monitoring**: Flow, pressure, level sensors in process lines
- **Safety Monitoring**: Gas detection, proximity sensors, emergency systems

### Data Collection Architecture
- **Edge Devices**: Industrial IoT gateways with local processing
- **Communication Protocols**: MQTT, OPC-UA for industrial communications
- **Data Preprocessing**: Local filtering, aggregation, alarm processing
- **Cloud Connectivity**: Secure VPN connections to cloud services

### IoT Platform Selection
- **Industrial IoT Platforms**: Evaluate Azure IoT, AWS IoT, GE Predix
- **Scalability Requirements**: Support for 10,000+ sensors, high-frequency data
- **Analytics Capabilities**: Real-time streaming, batch processing, ML integration
- **Security Features**: Device authentication, encrypted communications

## Advanced Analytics Implementation
### Data Science Capabilities
- **Descriptive Analytics**: Historical performance dashboards
- **Diagnostic Analytics**: Root cause analysis, correlation studies
- **Predictive Analytics**: Failure prediction, demand forecasting
- **Prescriptive Analytics**: Optimization recommendations, autonomous decisions

### Machine Learning Applications
- **Quality Prediction**: Real-time quality score prediction
- **Anomaly Detection**: Equipment behavior anomaly identification
- **Optimization Models**: Production schedule optimization
- **Computer Vision**: Automated visual inspection systems

### Analytics Infrastructure
- **Data Processing**: Apache Spark for big data processing
- **ML Platforms**: TensorFlow, PyTorch for model development
- **Visualization Tools**: Grafana, PowerBI for dashboards
- **Model Management**: MLOps for model deployment, monitoring

## Workforce Transformation
### Skills Development Program
- **Digital Literacy**: Basic computer skills, mobile device usage
- **Data Analytics**: Statistical analysis, data interpretation
- **Advanced Technologies**: IoT, AI, digital twin concepts
- **Problem Solving**: Data-driven decision making, root cause analysis

### Organizational Changes
- **New Roles**: Data Scientists, IoT Engineers, Digital Process Engineers
- **Enhanced Roles**: Operators become data analysts, maintenance becomes predictive
- **Cross-Functional Teams**: IT/OT collaboration, agile development teams
- **Culture Change**: Data-driven culture, continuous improvement mindset

### Change Management Strategy
- **Leadership Engagement**: Executive sponsorship, visible commitment
- **Communication Plan**: Regular updates, success story sharing
- **Training Programs**: Phased learning, hands-on workshops
- **Incentive Alignment**: Performance metrics include digital adoption

## Cybersecurity Framework
### Industrial Cybersecurity
- **Network Segmentation**: Separate OT/IT networks with controlled access
- **Access Control**: Multi-factor authentication, role-based access
- **Monitoring**: Real-time threat detection, security information management
- **Incident Response**: Defined procedures for cyber incidents

### Compliance Requirements
- **NIST Framework**: Implement NIST Cybersecurity Framework
- **Industry Standards**: Comply with IEC 62443 industrial security standards
- **Regulatory Requirements**: Meet FDA, EPA, OSHA cybersecurity requirements
- **Audit Readiness**: Regular security assessments, documentation

## Return on Investment (ROI) Framework
### Financial Benefits
- **Operational Efficiency**: 15-25% improvement in overall equipment effectiveness
- **Quality Improvements**: 50% reduction in defect rates, warranty costs
- **Maintenance Savings**: 20-30% reduction in maintenance costs
- **Energy Optimization**: 10-15% reduction in energy consumption

### Productivity Gains
- **Production Throughput**: 10-20% increase through optimization
- **Inventory Reduction**: 25-40% reduction in work-in-process inventory
- **Labor Productivity**: 15-30% improvement in labor efficiency
- **Time-to-Market**: 20-50% reduction in new product introduction time

### Risk Mitigation
- **Quality Risk**: Reduced product recalls, customer complaints
- **Operational Risk**: Decreased unplanned downtime, safety incidents
- **Compliance Risk**: Improved regulatory compliance, audit readiness
- **Cybersecurity Risk**: Enhanced protection against cyber threats

## Implementation Timeline & Milestones
### Year 1 Milestones
- Complete infrastructure upgrades and basic connectivity
- Deploy initial sensor networks and data collection systems
- Implement foundational cybersecurity measures
- Begin workforce training programs

### Year 2 Milestones  
- Deploy advanced analytics and machine learning capabilities
- Implement digital twin prototypes for critical equipment
- Achieve initial ROI targets from efficiency improvements
- Complete organizational restructuring for digital operations

### Year 3 Milestones
- Achieve autonomous operations in pilot areas
- Full-scale digital twin implementation
- Realize targeted financial benefits
- Establish center of excellence for continuous innovation

## Success Metrics
### Operational Metrics
- **Overall Equipment Effectiveness (OEE)**: Target >85% (baseline 70%)
- **First Pass Yield**: Target >95% (baseline 88%)
- **Unplanned Downtime**: Reduce to <2% (baseline 8%)
- **Inventory Turns**: Increase to 15x annually (baseline 8x)

### Financial Metrics
- **ROI Achievement**: 3-year payback on digital investments
- **Cost Reduction**: 20% reduction in manufacturing costs
- **Revenue Growth**: 15% increase from improved customer satisfaction
- **Capital Efficiency**: 25% improvement in asset utilization

### Technology Metrics
- **System Availability**: >99.5% uptime for critical systems
- **Data Quality**: >95% accuracy for key performance indicators
- **Cybersecurity**: Zero successful cyber attacks, 100% compliance
- **User Adoption**: >90% employee engagement with digital tools

## Vendor Management Strategy
- **Technology Partners**: Strategic relationships with key technology providers
- **System Integration**: Qualified partners for complex implementations
- **Support Services**: 24/7 support for critical systems
- **Innovation Partnerships**: Collaboration on emerging technologies

## Last Updated: August 2025`
  }
];

async function createSamplePlaybooks() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // First, delete existing sample playbooks to avoid duplicates
    console.log('Clearing existing sample playbooks...');
    await client.query('DELETE FROM ai_memories WHERE type = $1 AND category = $2', ['playbook', 'sample']);
    
    console.log('Creating comprehensive sample playbooks...');
    
    for (const playbook of samplePlaybooks) {
      const insertQuery = `
        INSERT INTO ai_memories (
          user_id, type, category, content, context, confidence, 
          importance, source, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id
      `;
      
      const context = JSON.stringify({
        title: playbook.title,
        description: playbook.description,
        tags: playbook.tags,
        category: playbook.category,
        created_by: 'system',
        version: '1.0'
      });
      
      const result = await client.query(insertQuery, [
        '1', // user_id (system user)
        'playbook', // type
        'sample', // category (marking as sample data)
        playbook.content, // content
        context, // context with metadata
        0.95, // confidence
        'high', // importance
        'system_generated', // source
        true // is_active
      ]);
      
      console.log(`✓ Created playbook: "${playbook.title}" (ID: ${result.rows[0].id})`);
    }
    
    console.log(`\n🎉 Successfully created ${samplePlaybooks.length} comprehensive sample playbooks!`);
    console.log('\nPlaybook Topics Created:');
    samplePlaybooks.forEach((playbook, index) => {
      console.log(`${index + 1}. ${playbook.title}`);
      console.log(`   Tags: ${playbook.tags.join(', ')}`);
      console.log(`   Category: ${playbook.category}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error creating sample playbooks:', error);
  } finally {
    await client.end();
  }
}

// Run the script
createSamplePlaybooks().catch(console.error);