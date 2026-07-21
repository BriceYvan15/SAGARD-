#!/bin/bash
set -e
mkdir -p /opt/sagard/api/deploy
cp /tmp/sagard-deploy/agents.service.ts /opt/sagard/api/apps/api/src/operations/agents/
cp /tmp/sagard-deploy/agents.controller.ts /opt/sagard/api/apps/api/src/operations/agents/
cp /tmp/sagard-deploy/schema.prisma /opt/sagard/api/packages/database/prisma/
cp /tmp/sagard-deploy/add-agent-termination.sql /opt/sagard/api/deploy/
echo '--- FILES COPIED ---'
cd /opt/sagard/api
export DATABASE_URL=$(cat .env | grep DATABASE_URL | head -1 | cut -d= -f2- | tr -d '"')
psql "$DATABASE_URL" -f deploy/add-agent-termination.sql 2>&1 || true
echo '--- SQL DONE ---'
npx prisma generate 2>&1 | tail -3
echo '--- PRISMA GEN DONE ---'
npx tsc -p apps/api/tsconfig.json --outDir apps/api/dist 2>&1 | tail -5
echo '--- TSC DONE ---'
pm2 restart sagard-api
sleep 3
curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/api/v1/agents
echo ' AGENTS API'
