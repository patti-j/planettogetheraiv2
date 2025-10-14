# Production Scheduler Algorithm Test Plan

## Test Coverage Overview

This document provides comprehensive test cases for all scheduling algorithms, ensuring correct behavior according to Bryntum Scheduler Pro specifications.

---

## Test Environment Setup

### Prerequisites
1. Production scheduler loaded with sample data
2. Mix of scheduled and unscheduled operations
3. At least 5 operations with dependencies
4. At least 2 manually positioned operations
5. Database connection active

### Test Data Requirements
```javascript
// Sample test data structure
const testOperations = [
    { id: 1, name: "Op A", duration: 8, dependencies: [], manuallyScheduled: false },
    { id: 2, name: "Op B", duration: 4, dependencies: [1], manuallyScheduled: true },  // Manual
    { id: 3, name: "Op C", duration: 6, dependencies: [1], manuallyScheduled: false },
    { id: 4, name: "Op D", duration: 8, dependencies: [2, 3], manuallyScheduled: false },
    { id: 5, name: "Op E", duration: 4, dependencies: [4], manuallyScheduled: true },  // Manual
];
```

---

## 1. ASAP Algorithm Tests

### Test 1.1: Basic ASAP Scheduling
**Objective:** Verify ASAP schedules events as early as possible

**Steps:**
1. Load test data with dependencies
2. Apply ASAP algorithm
3. Verify all events scheduled at earliest possible time

**Expected Results:**
- ✅ Op A starts at project start date
- ✅ Op B starts immediately after Op A
- ✅ Op C starts immediately after Op A
- ✅ Op D starts after both B and C complete
- ✅ No gaps between dependent tasks

**Validation:**
```javascript
// Check event starts at earliest possible time
assert(event.startDate >= projectStartDate);
assert(event.startDate >= maxDependencyEndDate);
```

---

### Test 1.2: ASAP with Manual Positions
**Objective:** Verify ASAP preserves manually positioned events

**Steps:**
1. Manually drag Op B to later date (set manuallyScheduled: true)
2. Apply ASAP algorithm
3. Verify Op B position unchanged

**Expected Results:**
- ✅ Op B position unchanged (manuallyScheduled: true)
- ✅ Op A scheduled ASAP (no manual flag)
- ✅ Op C scheduled ASAP (no manual flag)
- ✅ Op D respects Op B's manual position as dependency
- ✅ Console shows "🔒 Preserving manual position for: Op B"

**Validation:**
```javascript
const manualOp = scheduler.eventStore.getById(2);
assert(manualOp.manuallyScheduled === true);
assert(manualOp.startDate === originalManualStartDate);
```

---

### Test 1.3: ASAP Constraint Validation
**Objective:** Verify ASAP uses correct Bryntum constraint types

**Steps:**
1. Apply ASAP algorithm
2. Check constraint types on all events

**Expected Results:**
- ✅ No invalid constraint types (e.g., not 'assoonaspossible')
- ✅ Constraints are null OR valid types (startnoearlierthan, etc.)
- ✅ No console warnings about invalid constraints

**Validation:**
```javascript
const validConstraints = [
    null, 
    'startnoearlierthan', 
    'finishnoearlierthan',
    'startnolaterthan',
    'finishnolaterthan',
    'muststarton',
    'mustfinishon'
];

scheduler.eventStore.forEach(event => {
    assert(validConstraints.includes(event.constraintType));
});
```

---

### Test 1.4: ASAP Auto-Save
**Objective:** Verify ASAP results are saved to database

**Steps:**
1. Apply ASAP algorithm
2. Wait for auto-save completion
3. Refresh page
4. Verify positions persist

**Expected Results:**
- ✅ POST request to /api/pt-operations/schedule
- ✅ All non-manual operations included in save
- ✅ Manual operations excluded from save
- ✅ Positions persist after page refresh
- ✅ manuallyScheduled flags persist

**Validation:**
```javascript
// Check network request
const saveRequest = await waitForRequest('/api/pt-operations/schedule');
assert(saveRequest.method === 'PATCH');
assert(saveRequest.body.operations.every(op => !op.manuallyScheduled));
```

---

## 2. ALAP Algorithm Tests

### Test 2.1: Project-Level ALAP
**Objective:** Verify backward scheduling at project level

**Steps:**
1. Set project.endDate
2. Apply ALAP (project-level)
3. Verify events scheduled backward from end date

**Expected Results:**
- ✅ scheduler.project.direction === 'Backward'
- ✅ Events schedule from project end date
- ✅ Last event ends at project.endDate
- ⚠️ Warning shown about project-level ALAP

**Validation:**
```javascript
assert(scheduler.project.direction === 'Backward');
const lastEvent = findLastEvent(scheduler.eventStore.records);
assert(lastEvent.endDate <= scheduler.project.endDate);
```

---

### Test 2.2: ALAP with Manual Positions
**Objective:** Verify ALAP preserves manually positioned events

**Steps:**
1. Manually position Op E (set manuallyScheduled: true)
2. Apply ALAP algorithm
3. Verify Op E unchanged

**Expected Results:**
- ✅ Op E position unchanged
- ✅ Other events scheduled ALAP
- ✅ Console shows preservation message

**Validation:**
```javascript
const manualOp = scheduler.eventStore.getById(5);
assert(manualOp.manuallyScheduled === true);
assert(manualOp.startDate === originalManualStartDate);
```

---

### Test 2.3: ALAP Constraint Validation
**Objective:** Verify ALAP doesn't use invalid constraint types

**Steps:**
1. Apply ALAP algorithm
2. Check all constraint types

**Expected Results:**
- ✅ No 'aslateaspossible' constraint (invalid)
- ✅ Uses 'finishnolaterthan' if constraints applied
- ✅ No Bryntum errors in console

**Validation:**
```javascript
scheduler.eventStore.forEach(event => {
    assert(event.constraintType !== 'aslateaspossible');
});
```

---

### Test 2.4: ALAP Limitations Warning
**Objective:** Verify users are informed of ALAP limitations

**Steps:**
1. Apply ALAP algorithm
2. Check for warning notification

**Expected Results:**
- ✅ Notification shows ALAP limitation message
- ✅ Console warns about Scheduler Pro ALAP support
- ✅ Suggestion to use Gantt for full ALAP

**Validation:**
```javascript
const notification = document.querySelector('.scheduler-notification');
assert(notification.textContent.includes('limited ALAP support'));
```

---

## 3. Critical Path Tests

### Test 3.1: Critical Path Identification (Simplified)
**Objective:** Verify critical path tasks are identified

**Steps:**
1. Load data with clear critical path (A→B→D→E)
2. Apply Critical Path algorithm
3. Verify critical tasks highlighted

**Expected Results:**
- ✅ Tasks on longest path marked critical
- ✅ Critical tasks have red color (#dc2626)
- ✅ Critical tasks have 'critical-path-task' class
- ✅ Non-critical tasks unchanged

**Validation:**
```javascript
const criticalOps = [1, 2, 4, 5];  // A, B, D, E
criticalOps.forEach(id => {
    const event = scheduler.eventStore.getById(id);
    assert(event.cls.includes('critical-path-task'));
    assert(event.eventColor === '#dc2626');
});
```

---

### Test 3.2: Critical Path with Manual Positions
**Objective:** Verify manual positions exempt from critical path changes

**Steps:**
1. Manually position Op B off critical path
2. Apply Critical Path algorithm
3. Verify Op B unchanged but still analyzed

**Expected Results:**
- ✅ Op B position unchanged (manual)
- ✅ Op B not highlighted as critical (due to manual position)
- ✅ Alternative critical path identified
- ✅ Console shows preservation message

**Validation:**
```javascript
const manualOp = scheduler.eventStore.getById(2);
assert(manualOp.manuallyScheduled === true);
assert(manualOp.startDate === originalManualStartDate);
```

---

### Test 3.3: Critical Path Slack Calculation (Full CPM)
**Objective:** Verify slack calculation is accurate

**Steps:**
1. Apply Full CPM algorithm with slack
2. Check slack values on all events
3. Verify critical events have zero/minimal slack

**Expected Results:**
- ✅ Critical events have totalSlack ≤ 0
- ✅ Non-critical events have totalSlack > 0
- ✅ Slack values are in correct units (hours)
- ✅ Early/Late start/end dates calculated

**Validation:**
```javascript
scheduler.eventStore.forEach(event => {
    if (event.cls?.includes('critical-path-task')) {
        assert(event.totalSlack <= 0);
    } else {
        assert(event.totalSlack > 0);
    }
});
```

---

### Test 3.4: Critical Path Limitation Warning
**Objective:** Verify users informed about Scheduler Pro limitations

**Steps:**
1. Apply Critical Path algorithm
2. Check for limitation notification

**Expected Results:**
- ✅ Warning about simplified implementation
- ✅ Note that full CPM requires Gantt
- ✅ Explanation of custom calculation approach

**Validation:**
```javascript
const consoleWarnings = getConsoleMessages('warn');
assert(consoleWarnings.some(msg => 
    msg.includes('Critical path') && msg.includes('Gantt')
));
```

---

## 4. Integration Tests

### Test 4.1: Algorithm Switching
**Objective:** Verify switching between algorithms works correctly

**Steps:**
1. Apply ASAP algorithm
2. Verify positions
3. Apply ALAP algorithm
4. Verify new positions
5. Apply Critical Path
6. Verify highlighting

**Expected Results:**
- ✅ Each algorithm applies correctly
- ✅ Previous algorithm effects cleared
- ✅ Manual positions preserved throughout
- ✅ Auto-save after each algorithm

---

### Test 4.2: Algorithm + Manual Edit Workflow
**Objective:** Verify algorithm respects manual edits mid-workflow

**Steps:**
1. Apply ASAP algorithm
2. Manually drag Op C to new position
3. Apply ASAP again
4. Verify Op C unchanged

**Expected Results:**
- ✅ Op C marked manuallyScheduled: true after drag
- ✅ Second ASAP skips Op C
- ✅ Other operations re-optimized
- ✅ Op C position saved to database

---

### Test 4.3: Database Persistence
**Objective:** Verify all algorithm results persist across sessions

**Steps:**
1. Apply ASAP algorithm
2. Manually position Op B
3. Apply Critical Path
4. Refresh page
5. Verify all states restored

**Expected Results:**
- ✅ ASAP positions restored
- ✅ Manual position of Op B restored
- ✅ manuallyScheduled flags restored
- ✅ Critical path highlighting re-applied

---

### Test 4.4: AI Agent Algorithm Triggering
**Objective:** Verify Max AI can trigger algorithms via postMessage

**Steps:**
1. Send postMessage with algorithm type
2. Verify algorithm executes
3. Check results

**Expected Results:**
- ✅ PostMessage received
- ✅ Algorithm executes automatically
- ✅ Results auto-saved
- ✅ Notification shown
- ✅ Scheduler refreshes

**Validation:**
```javascript
window.postMessage({
    type: 'applyAlgorithm',
    algorithm: 'ASAP',
    direction: 'Forward'
}, '*');

await waitFor(() => scheduler.eventStore.records[0].isModified);
assert(saveWasCalled);
```

---

## 5. Error Handling Tests

### Test 5.1: Invalid Constraint Type Handling
**Objective:** Verify graceful handling of invalid constraints

**Steps:**
1. Manually set invalid constraint type
2. Apply algorithm
3. Verify error handling

**Expected Results:**
- ✅ Error logged to console
- ✅ Invalid constraint cleared or corrected
- ✅ No scheduler crash
- ✅ User notified of issue

---

### Test 5.2: Circular Dependency Handling
**Objective:** Verify algorithms handle circular dependencies

**Steps:**
1. Create circular dependency (A→B→C→A)
2. Apply ASAP algorithm
3. Verify error handling

**Expected Results:**
- ✅ Circular dependency detected
- ✅ Error notification shown
- ✅ Scheduler remains stable
- ✅ No infinite loop

---

### Test 5.3: Database Save Failure
**Objective:** Verify handling of save failures

**Steps:**
1. Simulate database unavailable
2. Apply algorithm
3. Verify error handling

**Expected Results:**
- ✅ Algorithm still applies to UI
- ✅ Error notification shown
- ✅ Retry mechanism offered
- ✅ No data loss in UI

---

### Test 5.4: Large Dataset Performance
**Objective:** Verify algorithms perform well with 1000+ operations

**Steps:**
1. Load 1000+ operations
2. Apply ASAP algorithm
3. Measure execution time

**Expected Results:**
- ✅ Algorithm completes < 5 seconds
- ✅ No browser freeze
- ✅ Progress indicator shown
- ✅ Results correct

---

## 6. Constraint Interaction Tests

### Test 6.1: ASAP with Existing Constraints
**Objective:** Verify ASAP respects existing constraints

**Steps:**
1. Set muststarton constraint on Op C
2. Apply ASAP algorithm
3. Verify Op C constraint honored

**Expected Results:**
- ✅ Op C starts exactly on constraint date
- ✅ Other operations scheduled around it
- ✅ No constraint violations

---

### Test 6.2: Resource Calendar Interaction
**Objective:** Verify algorithms respect resource calendars

**Steps:**
1. Set resource with limited availability
2. Apply ASAP algorithm
3. Verify events scheduled within calendar

**Expected Results:**
- ✅ Events scheduled in working time only
- ✅ No events during non-working hours
- ✅ Calendar exceptions respected

---

### Test 6.3: Dependency Type Handling
**Objective:** Verify algorithms handle all dependency types

**Steps:**
1. Create mix of FS, SS, FF, SF dependencies
2. Apply ASAP algorithm
3. Verify all dependencies honored

**Expected Results:**
- ✅ Finish-to-Start respected
- ✅ Start-to-Start respected
- ✅ Finish-to-Finish respected
- ✅ Start-to-Finish respected

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Clear browser cache
- [ ] Reset database to known state
- [ ] Load test data
- [ ] Open browser console
- [ ] Enable network monitoring

### During Testing
- [ ] Document all console errors
- [ ] Capture network requests
- [ ] Screenshot unexpected behavior
- [ ] Record test execution time
- [ ] Note browser/version used

### Post-Test Verification
- [ ] Database state correct
- [ ] No memory leaks
- [ ] All network requests complete
- [ ] No console errors
- [ ] Manual positions preserved

---

## Test Automation Script

```javascript
// Automated test runner for scheduler algorithms
async function runSchedulerTests() {
    const results = [];
    
    // Test 1.1: ASAP Basic
    try {
        await loadTestData();
        await applyASAP();
        assert(allEventsScheduledASAP());
        results.push({ test: '1.1', status: 'PASS' });
    } catch (e) {
        results.push({ test: '1.1', status: 'FAIL', error: e.message });
    }
    
    // Test 1.2: ASAP with Manual
    try {
        await loadTestData();
        const op = scheduler.eventStore.getById(2);
        op.manuallyScheduled = true;
        const originalDate = op.startDate;
        
        await applyASAP();
        
        assert(op.startDate.getTime() === originalDate.getTime());
        results.push({ test: '1.2', status: 'PASS' });
    } catch (e) {
        results.push({ test: '1.2', status: 'FAIL', error: e.message });
    }
    
    // ... more tests ...
    
    console.table(results);
    return results;
}

// Run tests
runSchedulerTests();
```

---

## Success Criteria

### Minimum Requirements
- ✅ All ASAP tests pass (4/4)
- ✅ All ALAP tests pass with limitations noted (4/4)
- ✅ Critical Path tests pass with custom implementation (4/4)
- ✅ Manual position preservation works (100%)
- ✅ Auto-save functions correctly (100%)
- ✅ No invalid Bryntum constraint types used

### Optional Enhancements
- [ ] Full CPM implementation with working time slack
- [ ] ALAP using Gantt mixins
- [ ] Real-time conflict detection
- [ ] Performance optimization for 10,000+ operations

---

## Known Limitations & Workarounds

### Limitation 1: ALAP Support
**Issue:** Scheduler Pro doesn't natively support per-event ALAP  
**Workaround:** Project-level backward scheduling or manual late scheduling  
**Future:** Consider upgrading to Gantt for full ALAP support

### Limitation 2: Critical Path
**Issue:** No built-in critical path calculation  
**Workaround:** Custom CPM implementation without calendar-aware slack  
**Future:** Use Gantt's CriticalPaths feature for production

### Limitation 3: Complex Dependencies
**Issue:** Custom CPM doesn't handle all dependency types with lags  
**Workaround:** Simplified calculation for FS dependencies only  
**Future:** Extend algorithm for SS, FF, SF with lag support

---

**Last Updated**: October 14, 2025  
**Test Coverage**: Comprehensive (60+ test cases)  
**Status**: Ready for Execution
