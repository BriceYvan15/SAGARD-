#!/bin/bash
cd /opt/sagard/api/packages/database/prisma

# Add termination fields after "notes  String?"
sed -i '/^  notes             String?$/a\  terminationReason String?\n  terminatedAt      DateTime?\n  terminatedById    String?\n  terminatedBy      User?      @relation("AgentTerminatedBy", fields: [terminatedById], references: [id])' schema.prisma

# Add terminatedAgents relation to User model after incidentOpsValidations line
sed -i '/^  incidentOpsValidations   Incident\[\] @relation("IncidentOpsReportValidatedBy")$/a\  terminatedAgents         Agent[]    @relation("AgentTerminatedBy")' schema.prisma

echo "RENVOYE count: $(grep -c RENVOYE schema.prisma)"
echo "terminationReason count: $(grep -c terminationReason schema.prisma)"
echo "terminatedAgents count: $(grep -c terminatedAgents schema.prisma)"
