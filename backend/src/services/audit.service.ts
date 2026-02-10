import prisma from '../repositories/prisma.js';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  userId: number;
  userName: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an audit entry
 */
export async function log(entry: AuditEntry) {
  return prisma.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityName: entry.entityName,
      userId: entry.userId,
      userName: entry.userName,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
    },
  });
}

/**
 * Query audit logs with filters
 */
export async function getLogs(query: {
  entityType?: string;
  entityId?: number;
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { entityType, entityId, userId, action, startDate, endDate, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Parse details JSON
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get recent activity for a specific entity
 */
export async function getEntityHistory(entityType: string, entityId: number, limit = 20) {
  const logs = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
  }));
}

// Action constants for consistency
export const AuditActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // CRUD
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // Inventory
  RECEIVE: 'RECEIVE',
  FULFILL: 'FULFILL',
  RETURN: 'RETURN',
  CORRECTION: 'CORRECTION',
  
  // Requests
  APPROVE: 'APPROVE',
  CANCEL: 'CANCEL',
  
  // Admin
  ROLE_CHANGE: 'ROLE_CHANGE',
  BARCODE_REGEN: 'BARCODE_REGEN',
} as const;
