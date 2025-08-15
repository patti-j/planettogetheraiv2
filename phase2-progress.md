✓ Phase 2 Progress: Updated 5 key storage methods to use PT Publish tables

## Methods Updated:
1. getProductionOrders() - Redirected to pt_publish_jobs
2. getOperations() - Redirected to pt_publish_job_operations
3. getResources() - Redirected to pt_publish_resources
4. getDiscreteOperations() - Redirected to pt_publish_job_operations
5. getProcessOperations() - Redirected to pt_publish_job_operations

## Next Steps:
- Phase 3: Update frontend pages to use new PT endpoints
- Phase 4: Test thoroughly, then delete old tables
