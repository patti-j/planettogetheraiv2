# Production Scheduler Algorithm Implementation Status

## Summary
This document provides a comprehensive overview of scheduling algorithm capabilities in PlanetTogether's Production Scheduler, comparing what's available in Bryntum Scheduler Pro vs. what would require Bryntum Gantt or custom implementation.

---

## ✅ Currently Implemented Algorithms

### 1. **ASAP (As Soon As Possible) - Forward Scheduling**
- **Status**: ✅ Implemented with workaround
- **Implementation**: Removes constraints to allow dependency-based forward scheduling
- **Manual Preservation**: ✅ Yes - respects `manuallyScheduled` flag
- **Auto-Save**: ✅ Yes - saves only modified, non-manual operations
- **Limitations**: Not a true ASAP algorithm but achieves similar results

### 2. **ALAP (As Late As Possible) - Backward Scheduling**
- **Status**: ⚠️ Limited implementation
- **Implementation**: Uses `finishnolaterthan` constraint as workaround
- **Manual Preservation**: ✅ Yes
- **Auto-Save**: ✅ Yes
- **Limitations**: 
  - Full ALAP requires Bryntum Gantt
  - Current implementation is a workaround, not native support
  - Shows warning to users about limitations

### 3. **Critical Path Method (CPM)**
- **Status**: ⚠️ Simplified implementation
- **Implementation**: Custom calculation with simplified slack analysis
- **Manual Preservation**: ✅ Yes
- **Visual Indicators**: ✅ Red coloring and CSS class for critical tasks
- **Limitations**:
  - Native CPM only available in Bryntum Gantt
  - Current implementation uses simplified logic
  - May not handle complex dependency networks accurately

---

## ❌ Not Implemented (Removed from UI)

### 4. **Resource Leveling**
- **Status**: ❌ Not implemented
- **Reason**: Not available in Scheduler Pro; requires custom implementation
- **What it does**: Balances resource utilization to avoid overallocation

### 5. **Drum-Buffer-Rope (Theory of Constraints)**
- **Status**: ❌ Not implemented
- **Reason**: Requires custom implementation
- **What it does**: Optimizes throughput by managing system constraints

---

## 📋 Constraint-Based Scheduling Details

### **Scope**: Per Operation/Event
Each operation in the schedule can have individual constraints that control when it can be scheduled.

### **Available Constraint Types in Scheduler Pro**

| Constraint | Type | Description | Auto-Applied |
|------------|------|-------------|--------------|
| **MSO** | Inflexible | Must Start On exact date | No |
| **MFO** | Inflexible | Must Finish On exact date | No |
| **SNET** | Semi-flexible | Start No Earlier Than | Yes (on drag) |
| **FNET** | Semi-flexible | Finish No Earlier Than | Yes (on resize) |
| **SNLT** | Semi-flexible | Start No Later Than | No |
| **FNLT** | Semi-flexible | Finish No Later Than | No |

### **How Users Invoke Constraints**
1. **Automatic**: Dragging operations auto-applies SNET/FNET constraints
2. **Manual**: Users need UI controls to set constraints directly (partially implemented)
3. **Programmatic**: Can be set via JavaScript API

---

## 🎯 What's Available in Bryntum Gantt (Not Scheduler Pro)

### **Native Algorithms**
1. **True ASAP/ALAP**: Built-in forward/backward scheduling modes
2. **Critical Path Method**: Automatic calculation with `totalSlack`, `earlyStart`, `lateFinish` fields
3. **PERT Integration**: Support for probabilistic time estimates
4. **Mixed Scheduling**: Per-task ASAP/ALAP (since v5.4.0)

### **Additional Features**
- Effort-driven scheduling
- Resource calendars with full integration
- Automatic slack calculation
- Project baselines and tracking

---

## 📊 PERT (Program Evaluation Review Technique)

### **What it is**
A probabilistic scheduling method for projects with uncertain durations.

### **Key Features**
- Uses 3 time estimates: Optimistic (O), Most Likely (M), Pessimistic (P)
- Formula: `Expected Time = (O + 4M + P) / 6`
- Focuses on uncertainty and risk management
- Complements CPM for better project planning

### **Status**: ❌ Not implemented (requires Gantt or custom implementation)

---

## 🥁 Theory of Constraints - Drum-Buffer-Rope (DBR)

### **What it is**
A manufacturing scheduling methodology that maximizes throughput by managing system constraints.

### **Core Components**
1. **Drum**: The constraint/bottleneck that sets production pace
2. **Buffer**: Time protection before the constraint
3. **Rope**: Controls work release based on constraint consumption

### **Implementation Requirements**
To implement DBR/ROPE, we would need:

```javascript
// Conceptual DBR Implementation
class DrumBufferRope {
  // 1. Identify Constraint
  identifyConstraint() {
    // Analyze resource utilization
    // Find bottleneck (highest utilization)
    // Return constraint resource
  }

  // 2. Set Buffer
  calculateBuffer() {
    // Typical: 3-7 days based on variability
    // Divide into zones: Green, Yellow, Red
    return bufferTime;
  }

  // 3. Schedule Drum
  scheduleDrum(constraint, orders) {
    // Build detailed schedule for constraint
    // Optimize sequence for throughput
    // Respect due dates
  }

  // 4. Establish Rope
  calculateReleaseDate(operation, bufferTime) {
    // Work backward from constraint need date
    // Release = ConstraintDate - BufferTime
    return releaseDate;
  }

  // 5. Monitor Buffer
  checkBufferPenetration(operation) {
    const zone = this.getBufferZone(operation);
    if (zone === 'red') {
      // Expedite immediately
      this.expedite(operation);
    } else if (zone === 'yellow') {
      // Monitor closely
      this.flag(operation);
    }
  }
}
```

### **Benefits of DBR**
- Increased throughput (20-66% typical)
- Reduced WIP (40-60% typical)
- Better on-time delivery (60% → 95%+)
- Simplified scheduling focus

### **Status**: ❌ Not implemented - Would require significant custom development

---

## 📅 Calendar & Working Time Management

### **Current Status**: ⚠️ Partial implementation
- Basic calendar UI created
- Backend integration needed
- Maintenance periods UI ready

### **Required Backend Implementation**
```javascript
// Calendar API endpoints needed
POST   /api/calendars           // Create calendar
GET    /api/calendars/:id        // Get calendar
PUT    /api/calendars/:id        // Update calendar
DELETE /api/calendars/:id        // Delete calendar

// Calendar assignment
POST   /api/resources/:id/calendar     // Assign calendar to resource
POST   /api/projects/:id/calendar      // Set project calendar

// Maintenance periods
POST   /api/maintenance-periods         // Schedule maintenance
GET    /api/maintenance-periods         // List maintenance
DELETE /api/maintenance-periods/:id    // Cancel maintenance
```

---

## 🚀 Recommendations

### **Immediate Actions**
1. ✅ **Done**: Remove non-working algorithms from UI
2. ✅ **Done**: Add warnings about limitations
3. ⚠️ **Partial**: Complete calendar management backend integration
4. ⚠️ **Partial**: Add constraint editing UI for operations

### **Short-term Improvements**
1. Implement basic resource leveling algorithm
2. Add constraint templates for common scenarios
3. Improve Critical Path calculation accuracy
4. Add buffer management visualization

### **Long-term Considerations**
1. **Evaluate Bryntum Gantt**: Would provide native CPM, PERT, true ASAP/ALAP
2. **Implement DBR/TOC**: High value for manufacturing but requires significant development
3. **Custom Algorithm Framework**: Allow users to define their own scheduling rules
4. **Machine Learning**: Predictive scheduling based on historical data

---

## 📈 Migration Path to Bryntum Gantt

If upgrading to Gantt, you would gain:

| Feature | Scheduler Pro | Gantt | Benefit |
|---------|--------------|--------|---------|
| ASAP/ALAP | Workaround | Native | Accurate scheduling |
| Critical Path | Simplified | Full CPM | Complete slack analysis |
| PERT | No | Yes | Risk management |
| Resource Leveling | No | Partial | Better resource utilization |
| Baselines | No | Yes | Track schedule changes |
| Project Templates | No | Yes | Reusable schedules |

---

## 📝 Notes

- **Constraint Application**: Currently per-operation, which is correct for manufacturing
- **Manual Scheduling**: Successfully preserves user adjustments across algorithm runs
- **Auto-Save**: Efficiently saves only changed, non-manual operations
- **User Education**: Need documentation/training on constraint types and when to use them

---

**Last Updated**: October 14, 2025
**Status**: Production-ready with documented limitations
**Next Review**: After calendar backend integration