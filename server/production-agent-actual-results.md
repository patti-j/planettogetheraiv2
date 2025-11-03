# Production Scheduling Agent - Actual Test Results
## Test Date: 11/3/2025, 10:41:02 PM
## Actual responses from the Production Scheduling Agent

---

## Test 1: "list jobs with their priorities and need by dates"

**Actual Response:**
```
**5 active jobs with details:**

**Priority 1 (Highest):**
• IPA Batch 2024-001 - Due: Nov 15, 2025, Status: In Progress

**Priority 2 (High):**
• Pilsner Batch 2024-003 - Due: Nov 15, 2025, Status: Scheduled

**Priority 3 (Medium):**
• Stout Batch 2024-005 - Due: Nov 15, 2025, Status: Scheduled

**Priority 4 (Low):**
• Wheat Beer 2024-008 - Due: Nov 15, 2025, Status: In Progress

**Priority 5 (Lowest):**
• Lager Batch 2024-012 - Due: Nov 15, 2025, Status: Scheduled

Would you like to see operations for any specific job?
```

---

## Test 2: "show me all jobs"

**Actual Response:**
```
Job all not found.
```

---

## Test 3: "which jobs are high priority?"

**Actual Response:**
```
**2 high-priority jobs:**

• IPA Batch 2024-001 (P1, due 11/15/2025)
• Pilsner Batch 2024-003 (P2, due 11/15/2025)

Would you like additional information about these jobs?
```

---

## Test 4: "what jobs are due this week?"

**Actual Response:**
```
No jobs due this week.
```

---

## Test 5: "show me overdue jobs"

**Actual Response:**
```
Job overdue not found.
```

---

## Test 6: "what's the status of jobs?"

**Actual Response:**
```
**Jobs by status:**

• Not Scheduled: 29 jobs
• Scheduled: 3 jobs
• In Progress: 2 jobs

Would you like to see jobs with a specific status?
```

---

## Test 7: "tell me about job IPA Batch 001"

**Actual Response:**
```
Job ipa not found.
```

---

## Test 8: "what operations are in job MO-001?"

**Actual Response:**
```
**5 active jobs**

• Priority 1 (highest): 1 jobs
• Priority 2 (high): 1 jobs
• Priority 3 (medium): 1 jobs
• Priority 4 (low): 1 jobs
• Priority 5 (lowest): 1 jobs

Would you like more detailed information?
```

---

## Test 9: "show completed jobs"

**Actual Response:**
```
No completed jobs found.
```

---

## Test 10: "jobs due today"

**Actual Response:**
```
No jobs due today.
```

---

## Test 11: "run ASAP optimization"

**Actual Response:**
```
I'm executing the ASAP scheduling algorithm. This will optimize your production schedule.
```

---

## Test 12: "apply JIT scheduling"

**Actual Response:**
```
I'm executing the ALAP scheduling algorithm. This will optimize your production schedule.
```

---

## Test 13: "what's the priority of MO-001?"

**Actual Response:**
```
Job of not found.
```

---

## Test 14: "show jobs"

**Actual Response:**
```
**5 active jobs with details:**

**Priority 1 (Highest):**
• IPA Batch 2024-001 - Due: Nov 15, 2025, Status: In Progress

**Priority 2 (High):**
• Pilsner Batch 2024-003 - Due: Nov 15, 2025, Status: Scheduled

**Priority 3 (Medium):**
• Stout Batch 2024-005 - Due: Nov 15, 2025, Status: Scheduled

**Priority 4 (Low):**
• Wheat Beer 2024-008 - Due: Nov 15, 2025, Status: In Progress

**Priority 5 (Lowest):**
• Lager Batch 2024-012 - Due: Nov 15, 2025, Status: Scheduled

Would you like to see operations for any specific job?
```

---

## Test 15: "list all jobs"

**Actual Response:**
```
**5 active jobs with details:**

**Priority 1 (Highest):**
• IPA Batch 2024-001 - Due: Nov 15, 2025, Status: In Progress

**Priority 2 (High):**
• Pilsner Batch 2024-003 - Due: Nov 15, 2025, Status: Scheduled

**Priority 3 (Medium):**
• Stout Batch 2024-005 - Due: Nov 15, 2025, Status: Scheduled

**Priority 4 (Low):**
• Wheat Beer 2024-008 - Due: Nov 15, 2025, Status: In Progress

**Priority 5 (Lowest):**
• Lager Batch 2024-012 - Due: Nov 15, 2025, Status: Scheduled

Would you like to see operations for any specific job?
```

---

## Test Summary

- Total queries tested: 15
- Test completed at: 11/3/2025, 10:41:04 PM
- Agent: ProductionSchedulingAgentService
- User context: patti (ID: 4)