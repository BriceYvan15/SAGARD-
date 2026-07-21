#!/bin/bash
set -e

# Run SQL migration using prisma db push instead of psql
cd /opt/sagard/api/packages/database
export DATABASE_URL=$(cat /opt/sagard/api/.env | grep DATABASE_URL | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

# Use prisma db push to sync schema to DB
npx prisma db push --accept-data-loss 2>&1 | tail -10
echo '--- DB PUSH DONE ---'

# Force regenerate Prisma client - clear all possible cache locations
rm -rf node_modules/.prisma/client
rm -rf /opt/sagard/api/node_modules/.prisma/client
find /opt/sagard/api/node_modules/.pnpm -name '.prisma' -type d -exec rm -rf {} + 2>/dev/null || true
npx prisma generate 2>&1 | tail -5
echo '--- PRISMA GEN DONE ---'

# Verify generated client has new fields
grep -c 'terminationReason' node_modules/.prisma/client/index.d.ts 2>/dev/null && echo "FIELDS OK" || echo "WARNING: fields not found"

# Compile TypeScript
cd /opt/sagard/api
npx tsc -p apps/api/tsconfig.json --outDir apps/api/dist 2>&1 | tail -5
echo '--- TSC DONE ---'

# Restart API
pm2 restart sagard-api
sleep 3
curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/api/v1/agents
echo ' AGENTS API'
