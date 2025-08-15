#!/bin/bash

# Fix drag-drop hook API endpoints
sed -i 's|/api/operations/|/api/pt-operations/|g' client/src/hooks/use-drag-drop.ts
sed -i 's|/api/operations"|/api/pt-operations"|g' client/src/hooks/use-drag-drop.ts
sed -i 's|/api/jobs"|/api/pt-jobs"|g' client/src/hooks/use-drag-drop.ts

# Fix other files that reference old endpoints
find client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|/api/production-orders|/api/pt-jobs|g'
find client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|/api/discrete-operations|/api/pt-operations|g'
find client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|/api/process-operations|/api/pt-operations|g'

echo "API endpoints updated successfully"
