#!/bin/bash

# Update schema.ts
echo "Updating schema.ts..."

# Replace table names in pgTable definitions
sed -i 's/pgTable("pt_publish_master_production_schedule"/pgTable("ptMasterProductionSchedule"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_jobs"/pgTable("ptJobs"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_resources"/pgTable("ptResources"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_job_operations"/pgTable("ptJobOperations"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_job_activities"/pgTable("ptJobActivities"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_capabilities"/pgTable("ptCapabilities"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_metrics"/pgTable("ptMetrics"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_manufacturing_orders"/pgTable("ptManufacturingOrders"/g' shared/schema.ts
sed -i 's/pgTable("pt_publish_plants"/pgTable("ptPlants"/g' shared/schema.ts

# Replace variable names
sed -i 's/export const ptPublishJobs/export const ptJobs/g' shared/schema.ts
sed -i 's/export const ptPublishResources/export const ptResources/g' shared/schema.ts
sed -i 's/export const ptPublishJobOperations/export const ptJobOperations/g' shared/schema.ts
sed -i 's/export const ptPublishJobActivities/export const ptJobActivities/g' shared/schema.ts
sed -i 's/export const ptPublishCapabilities/export const ptCapabilities/g' shared/schema.ts
sed -i 's/export const ptPublishMetrics/export const ptMetrics/g' shared/schema.ts
sed -i 's/export const ptPublishManufacturingOrders/export const ptManufacturingOrders/g' shared/schema.ts
sed -i 's/export const ptPublishPlants/export const ptPlants/g' shared/schema.ts

# Replace schema references
sed -i 's/createInsertSchema(ptPublishJobs)/createInsertSchema(ptJobs)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishResources)/createInsertSchema(ptResources)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishJobOperations)/createInsertSchema(ptJobOperations)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishJobActivities)/createInsertSchema(ptJobActivities)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishCapabilities)/createInsertSchema(ptCapabilities)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishMetrics)/createInsertSchema(ptMetrics)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishManufacturingOrders)/createInsertSchema(ptManufacturingOrders)/g' shared/schema.ts
sed -i 's/createInsertSchema(ptPublishPlants)/createInsertSchema(ptPlants)/g' shared/schema.ts

# Replace type names
sed -i 's/export type PtPublishJob/export type PtJob/g' shared/schema.ts
sed -i 's/export type PtPublishResource/export type PtResource/g' shared/schema.ts
sed -i 's/export type PtPublishJobOperation/export type PtJobOperation/g' shared/schema.ts
sed -i 's/export type PtPublishJobActivity/export type PtJobActivity/g' shared/schema.ts
sed -i 's/export type PtPublishCapability/export type PtCapability/g' shared/schema.ts
sed -i 's/export type PtPublishMetric/export type PtMetric/g' shared/schema.ts
sed -i 's/export type PtPublishManufacturingOrder/export type PtManufacturingOrder/g' shared/schema.ts

# Replace infer select references
sed -i 's/typeof ptPublishJobs\.\$inferSelect/typeof ptJobs.$inferSelect/g' shared/schema.ts
sed -i 's/typeof ptPublishResources\.\$inferSelect/typeof ptResources.$inferSelect/g' shared/schema.ts
sed -i 's/typeof ptPublishJobOperations\.\$inferSelect/typeof ptJobOperations.$inferSelect/g' shared/schema.ts
sed -i 's/typeof ptPublishJobActivities\.\$inferSelect/typeof ptJobActivities.$inferSelect/g' shared/schema.ts
sed -i 's/typeof ptPublishCapabilities\.\$inferSelect/typeof ptCapabilities.$inferSelect/g' shared/schema.ts
sed -i 's/typeof ptPublishMetrics\.\$inferSelect/typeof ptMetrics.$inferSelect/g' shared/schema.ts
sed -i 's/typeof ptPublishManufacturingOrders\.\$inferSelect/typeof ptManufacturingOrders.$inferSelect/g' shared/schema.ts

# Replace insert schema names
sed -i 's/export const insertPtPublishJobSchema/export const insertPtJobSchema/g' shared/schema.ts
sed -i 's/export const insertPtPublishResourceSchema/export const insertPtResourceSchema/g' shared/schema.ts
sed -i 's/export const insertPtPublishJobOperationSchema/export const insertPtJobOperationSchema/g' shared/schema.ts
sed -i 's/export const insertPtPublishJobActivitySchema/export const insertPtJobActivitySchema/g' shared/schema.ts
sed -i 's/export const insertPtPublishCapabilitySchema/export const insertPtCapabilitySchema/g' shared/schema.ts
sed -i 's/export const insertPtPublishMetricSchema/export const insertPtMetricSchema/g' shared/schema.ts
sed -i 's/export const insertPtPublishManufacturingOrderSchema/export const insertPtManufacturingOrderSchema/g' shared/schema.ts

echo "Updating storage.ts imports..."

# Update storage.ts imports
sed -i 's/ptPublishJobs/ptJobs/g' server/storage.ts
sed -i 's/ptPublishResources/ptResources/g' server/storage.ts
sed -i 's/ptPublishJobOperations/ptJobOperations/g' server/storage.ts
sed -i 's/ptPublishJobActivities/ptJobActivities/g' server/storage.ts
sed -i 's/ptPublishCapabilities/ptCapabilities/g' server/storage.ts
sed -i 's/ptPublishMetrics/ptMetrics/g' server/storage.ts
sed -i 's/ptPublishManufacturingOrders/ptManufacturingOrders/g' server/storage.ts
sed -i 's/ptPublishPlants/ptPlants/g' server/storage.ts

# Update type imports
sed -i 's/PtPublishJob/PtJob/g' server/storage.ts
sed -i 's/PtPublishResource/PtResource/g' server/storage.ts
sed -i 's/PtPublishJobOperation/PtJobOperation/g' server/storage.ts
sed -i 's/PtPublishJobActivity/PtJobActivity/g' server/storage.ts
sed -i 's/PtPublishCapability/PtCapability/g' server/storage.ts
sed -i 's/PtPublishMetric/PtMetric/g' server/storage.ts
sed -i 's/PtPublishManufacturingOrder/PtManufacturingOrder/g' server/storage.ts

# Update raw SQL queries to use new table names
sed -i 's/pt_publish_job_operations/ptJobOperations/g' server/storage.ts
sed -i 's/pt_publish_jobs/ptJobs/g' server/storage.ts
sed -i 's/pt_publish_resources/ptResources/g' server/storage.ts
sed -i 's/pt_publish_job_activities/ptJobActivities/g' server/storage.ts
sed -i 's/pt_publish_manufacturing_orders/ptManufacturingOrders/g' server/storage.ts
sed -i 's/pt_publish_job_resources/ptJobResources/g' server/storage.ts
sed -i 's/pt_publish_plants/ptPlants/g' server/storage.ts

echo "Updating routes.ts imports..."

# Update routes.ts imports
sed -i 's/PtPublishJob/PtJob/g' server/routes.ts
sed -i 's/PtPublishResource/PtResource/g' server/routes.ts
sed -i 's/PtPublishJobOperation/PtJobOperation/g' server/routes.ts
sed -i 's/PtPublishJobActivity/PtJobActivity/g' server/routes.ts
sed -i 's/PtPublishCapability/PtCapability/g' server/routes.ts
sed -i 's/PtPublishMetric/PtMetric/g' server/routes.ts
sed -i 's/PtPublishManufacturingOrder/PtManufacturingOrder/g' server/routes.ts

echo "Updates complete!"