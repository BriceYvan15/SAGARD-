#!/bin/bash
set -e

# Verify schema has RENVOYE
COUNT=$(grep -c RENVOYE /opt/sagard/api/packages/database/prisma/schema.prisma)
echo "RENVOYE count in schema: $COUNT"

# Run SQL migration
cd /opt/sagard/api
export DATABASE_URL=$(cat .env | grep DATABASE_URL | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
echo "DB URL found: ${DATABASE_URL:0:30}..."
psql "$DATABASE_URL" -c "ALTER TYPE \"AgentStatus\" ADD VALUE IF NOT EXISTS 'RENVOYE';" 2>&1 || true
psql "$DATABASE_URL" -c "ALTER TABLE \"agents\" ADD COLUMN IF NOT EXISTS \"terminationReason\" TEXT;" 2>&1 || true
psql "$DATABASE_URL" -c "ALTER TABLE \"agents\" ADD COLUMN IF NOT EXISTS \"terminatedAt\" TIMESTAMP(3);" 2>&1 || true
psql "$DATABASE_URL" -c "ALTER TABLE \"agents\" ADD COLUMN IF NOT EXISTS \"terminatedById\" TEXT;" 2>&1 || true
psql "$DATABASE_URL" -c "ALTER TABLE \"agents\" ADD CONSTRAINT \"agents_terminatedById_fkey\" FOREIGN KEY (\"terminatedById\") REFERENCES \"users\"(\"id\") ON DELETE SET NULL;" 2>&1 || true
echo '--- SQL DONE ---'

# Regenerate Prisma client
cd /opt/sagard/api/packages/database
rm -rf node_modules/.prisma/client
npx prisma generate 2>&1 | tail -3
echo '--- PRISMA GEN DONE ---'

# Verify generated client has new fields
grep -c 'terminationReason' node_modules/.prisma/client/index.d.ts 2>/dev/null || echo "WARNING: terminationReason not found in generated client"

# Compile TypeScript
cd /opt/sagard/api
npx tsc -p apps/api/tsconfig.json --outDir apps/api/dist 2>&1 | tail -5
echo '--- TSC DONE ---'

# Restart API
pm2 restart sagard-api
sleep 3
curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/api/v1/agents
echo ' AGENTS API'
