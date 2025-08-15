# PT Publish Tables Schema Comparison

## RESOLUTION COMPLETE ✅
**Successfully aligned PT Publish tables with original SQL script!**
- Database tables already contained ALL columns from the original SQL script
- Schema definitions in code have been updated to include all missing columns
- Storage.ts queries updated to use raw SQL to avoid column mapping issues
- All PT Publish APIs now fully functional (Jobs, Resources, Manufacturing Orders)

## Jobs Table Comparison

### SQL Script (Original) - Complete Column List:
- PublishDate (datetime)
- InstanceId (nvarchar(38))
- JobId (bigint) 
- Customers (nvarchar(max))
- EntryDate (datetime)
- NeedDateTime (datetime)
- Classification (nvarchar(max))
- Commitment (nvarchar(max))
- Hot (bit)
- HotReason (nvarchar(max))
- Importance (int)
- Cancelled (bit)
- LatePenaltyCost (float)
- MaxEarlyDeliveryDays (float)
- Priority (int)
- Type (nvarchar(max))
- Revenue (float)
- Profit (float)
- Scheduled (bit)
- ScheduledStartDateTime (datetime)
- ScheduledEndDateTime (datetime)
- LeadResource (nvarchar(max))
- StartsInDays (int)
- LatenessDays (float)
- Late (bit)
- Overdue (bit)
- Description (nvarchar(max))
- Notes (nvarchar(max))
- Finished (bit)
- Name (nvarchar(max))
- DoNotDelete (bit)
- ExternalId (nvarchar(max))
- Locked (nvarchar(max))
- Anchored (nvarchar(max))
- OrderNumber (nvarchar(max))
- OnHold (nvarchar(max))
- OnHoldReason (nvarchar(max))
- Template (bit)
- CustomerEmail (nvarchar(max))
- AgentEmail (nvarchar(max))
- DoNotSchedule (bit)
- ColorCode (nvarchar(max))
- EntryMethod (nvarchar(max))
- HoldUntil (datetime)
- PercentFinished (int)
- ScheduledStatus (nvarchar(max))
- StandardHours (float)
- Bottlenecks (nvarchar(max))
- CanSpanPlants (bit)
- CommitmentPreserved (bit)
- DoNotDeletePreserved (bit)
- DoNotSchedulePreserved (bit)
- EarliestDelivery (datetime)
- EnteredToday (bit)
- ExpectedRunHours (float)
- ExpectedSetupHours (float)
- FailedToScheduleReason (nvarchar(max))
- Hold (bit)
- HoldReason (nvarchar(max))
- LaborCost (float)
- MachineCost (float)
- MaterialCost (float)
- OverdueDays (float)
- PercentOfStandardHrs (int)
- PercentOverStandardHrs (int)
- Product (nvarchar(max))
- ProductDescription (nvarchar(max))
- Qty (float)
- ReportedRunHours (float)
- ReportedSetupHours (float)
- SchedulingHours (float)
- Started (bit)
- Throughput (float)
- ShippingCost (float)
- ExpectedLatePenaltyCost (float)
- SubcontractCost (float)
- TotalCost (float)
- Printed (bit)
- Invoiced (bit)
- Shipped (nvarchar(max))
- Destination (nvarchar(max))
- Reviewed (bit)
- PercentOfMaterialsAvailable (int)
- SuccessorOrderNumbers (nvarchar(max))
- ResourceNames (nvarchar(max))
- LowLevelCode (int)

### Our Current Schema (ptPublishJobs) - Missing Columns:
✅ publishDate, instanceId, jobId, customers, entryDate, needDateTime, classification, commitment, hot, hotReason, importance, cancelled, latePenaltyCost, maxEarlyDeliveryDays, priority, type, revenue, profit, scheduled

❌ MISSING:
- ScheduledStartDateTime
- ScheduledEndDateTime
- LeadResource
- StartsInDays
- LatenessDays
- Late
- Overdue
- Description
- Notes
- Finished
- Name
- DoNotDelete
- ExternalId
- Locked
- Anchored
- OrderNumber
- OnHold
- OnHoldReason
- Template
- CustomerEmail
- AgentEmail
- DoNotSchedule
- ColorCode
- EntryMethod
- HoldUntil
- PercentFinished
- ScheduledStatus
- StandardHours
- Bottlenecks
- CanSpanPlants
- CommitmentPreserved
- DoNotDeletePreserved
- DoNotSchedulePreserved
- EarliestDelivery
- EnteredToday
- ExpectedRunHours
- ExpectedSetupHours
- FailedToScheduleReason
- Hold
- HoldReason
- LaborCost
- MachineCost
- MaterialCost
- OverdueDays
- PercentOfStandardHrs
- PercentOverStandardHrs
- Product
- ProductDescription
- Qty
- ReportedRunHours
- ReportedSetupHours
- SchedulingHours
- Started
- Throughput
- ShippingCost
- ExpectedLatePenaltyCost
- SubcontractCost
- TotalCost
- Printed
- Invoiced
- Shipped
- Destination
- Reviewed
- PercentOfMaterialsAvailable
- SuccessorOrderNumbers
- ResourceNames
- LowLevelCode

## Resources Table Comparison

### SQL Script (Original) - Complete Column List:
- PublishDate (datetime)
- InstanceId (nvarchar(38))
- PlantId (bigint)
- DepartmentId (bigint)
- ResourceId (bigint)
- Name (nvarchar(max))
- Description (nvarchar(max))
- Notes (nvarchar(max))
- Bottleneck (bit)
- BufferHours (float)
- CapacityType (nvarchar(max))
- Drum (bit)
- OvertimeHourlyCost (float)
- StandardHourlyCost (float)
- ExperimentalDispatcherOne (bigint)
- ExperimentalDispatcherTwo (bigint)
- ExperimentalDispatcherThree (bigint)
- ExperimentalDispatcherFour (bigint)
- NormalDispatcher (bigint)
- Workcenter (nvarchar(max))
- CanOffload (bit)
- CanPreemptMaterials (bit)
- CanPreemptPredecessors (bit)
- CanWorkOvertime (bit)
- CycleEfficiencyMultiplier (float)
- HeadStartHours (float)
- PostActivityRestHours (float)
- Stage (int)
- TransferHours (float)
- ConsecutiveSetupTimes (bit)
- ActivitySetupEfficiencyMultiplier (float)
- ChangeoverSetupEfficiencyMultiplier (float)
- SetupIncluded (nvarchar(max))
- SetupHours (float)
- UseOperationSetupTime (bit)
- Active (bit)
- SameCell (bit)
- ResourceType (nvarchar(max))
- ExternalId (nvarchar(max))
- AlwaysShowPostProcessing (bit)
- AttributeCodeTableName (nvarchar(max))
- BottleneckPercent (float)
- BufferHrs (float)
- CellName (nvarchar(max))
- DisallowDragAndDrops (bit)
- ExcludeFromGantts (bit)
- ExperimentalOptimizeRule (nvarchar(max))
- ExperimentalOptimizeRuleTwo (nvarchar(max))
- ExperimentalOptimizeRuleThree (nvarchar(max))
- ExperimentalOptimizeRuleFour (nvarchar(max))
- GanttRowHeightFactor (int)
- HeadStartDays (float)
- ImageFileName (nvarchar(max))
- MaxQty (float)
- MaxQtyPerCycle (float)
- MinQty (float)
- MinQtyPerCycle (float)
- NbrCapabilities (int)
- NormalOptimizeRule (nvarchar(max))
- OverlappingOnlineIntervals (int)
- Sequential (bit)
- SetupHrs (float)
- ShopViewUsersCount (int)
- TransferHrs (float)
- WorkcenterExternalId (nvarchar(max))
- MaxCumulativeQty (float)
- ManualAssignmentOnly (bit)
- IsTank (bit)
- MinNbrOfPeople (float)
- BatchType (nvarchar(max))
- BatchVolume (float)
- AutoJoinHrs (float)
- OmitSetupOnFirstActivity (bit)
- OmitSetupOnFirstActivityInShift (bit)
- MinVolume (float)
- MaxVolume (float)
- StandardCleanHours (float)
- StandardCleanoutGrade (int)
- UseOperationCleanout (bit)
- UseAttributeCleanouts (bit)
- OperationCountCleanoutTriggerTableName (nvarchar(max))
- ProductionUnitCleanoutTriggerTableName (nvarchar(max))
- TimeCleanoutTriggerTableName (nvarchar(max))
- Priority (int)
- MaxSameSetupHours (float)
- MaxSameSetupHrs (float)
- SetupCodeTableName (nvarchar(max))

### Our Current Schema (ptPublishResources) - Missing Columns:
✅ publishDate, instanceId, plantId, departmentId, resourceId, name, description, notes, externalId, plantName, departmentName, active, speedFactor, jitLimitHrs, bottleneck, constrainedResource, secondaryPriorityType, attributeChangePenalties, loadPercent

❌ MISSING most columns from original SQL

## ManufacturingOrders Table Comparison

### SQL Script (Original) - Complete Column List:
- PublishDate (datetime)
- InstanceId (nvarchar(38))
- JobId (bigint)
- ManufacturingOrderId (bigint)
- Name (nvarchar(max))
- RequiredQty (float)
- ExpectedFinishQty (float)
- Description (nvarchar(max))
- ProductName (nvarchar(max))
- ProductDescription (nvarchar(max))
- Released (bit)
- ReleaseDate (datetime)
- Notes (nvarchar(max))
- Scheduled (bit)
- ScheduledStart (datetime)
- ScheduledEnd (datetime)
- CanSpanPlants (bit)
- CurrentPathId (bigint)
- DefaultPathId (bigint)
- Family (nvarchar(max))
- Finished (bit)
- Frozen (nvarchar(max))
- OnHold (nvarchar(max))
- HoldReason (nvarchar(max))
- Late (bit)
- LatenessDays (float)
- LeadTimeDays (float)
- Locked (nvarchar(max))
- LockedPlantId (bigint)
- UOM (nvarchar(max))
- ExternalId (nvarchar(max))
- Anchored (nvarchar(max))
- BreakOffSourceMOName (nvarchar(max))
- CopyRoutingFromTemplate (bit)
- HoldUntil (datetime)
- IsBreakOff (bit)
- NeedDate (datetime)
- PercentFinished (int)
- ProductColor (nvarchar(max))
- UseMONeedDate (bit)
- StandardHours (float)
- Bottlenecks (nvarchar(max))
- DefaultPathName (nvarchar(max))
- ExpectedRunHours (float)
- ExpectedSetupHours (float)
- Hold (bit)
- IsReleased (bit)
- LaborCost (float)
- LockedPlantName (nvarchar(max))
- MachineCost (float)
- MaterialCost (float)
- MoNeedDate (bit)
- PreserveRequiredQty (bit)
- ReleaseDateTime (datetime)
- ReportedRunHours (float)
- ReportedSetupHours (float)
- RequestedQty (float)
- SchedulingHours (float)
- AutoJoinGroup (nvarchar(max))
- Split (bit)
- SplitCount (int)
- SplitFromManufacturingOrderId (bigint)
- Started (bit)
- LockToCurrentAlternatePath (bit)
- DBRShippingBufferOverride (bigint)
- DbrReleaseDate (datetime)
- DbrShippingDueDate (datetime)
- DbrBufferHrs (float)
- ShippingBufferCurrentPenetrationPercent (float)
- ShippingBufferProjectedPenetrationPercent (float)
- DrumBufferProjectedPenetrationPercent (float)
- DrumBufferCurrentPenetrationPercent (float)

### Our Current Schema (ptPublishManufacturingOrders) - Missing Most Columns:
✅ publishDate, instanceId, manufacturingOrderId, jobId, moNumber, itemId, quantity, releaseDate, dueDate, status, priority, notes

❌ MISSING most columns from original SQL

## Final Status:
1. **Jobs Table**: ✅ Database has all columns, ✅ API working (1 record)
2. **Resources Table**: ✅ Database has all columns, ✅ API working (11 records)
3. **ManufacturingOrders Table**: ✅ Database has all columns, ✅ API working (5 records)
4. **Data Types**: ✅ Database types match original SQL
5. **Schema Definitions**: ✅ Updated with all columns from original SQL

## Implementation Summary:
1. ✅ Updated schema.ts with all missing columns from original SQL script
2. ✅ Modified storage.ts to use raw SQL queries for Resources and Manufacturing Orders
3. ✅ All PT Publish APIs tested and confirmed working
4. ✅ Complete alignment achieved between code schema and database structure