import { prisma } from '../config/prisma.js';

export interface AuditEntry {
  userId?: string | null;
  schoolId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string;
  ipAddress?: string | null;
}

export async function recordAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        schoolId: entry.schoolId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        details: entry.details ?? '',
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}
