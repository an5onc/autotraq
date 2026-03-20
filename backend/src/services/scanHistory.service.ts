import prisma from '../repositories/prisma.js';
import { ScanActionType } from '@prisma/client';

export interface LogScanInput {
  sku: string;
  userId: number;
  userName: string;
  partId?: number;
  actionType: ScanActionType;
  success?: boolean;
  errorMsg?: string;
  metadata?: Record<string, any>;
}

export interface ScanAnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  actionType?: ScanActionType;
}

export async function logScan(input: LogScanInput) {
  return prisma.scanHistory.create({
    data: {
      sku: input.sku,
      userId: input.userId,
      userName: input.userName,
      partId: input.partId,
      actionType: input.actionType,
      success: input.success ?? true,
      errorMsg: input.errorMsg,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function getScanHistory(query: ScanAnalyticsQuery & { limit?: number; offset?: number }) {
  const { startDate, endDate, userId, actionType, limit = 100, offset = 0 } = query;

  const where: any = {};

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = startDate;
    if (endDate) where.scannedAt.lte = endDate;
  }

  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;

  const [scans, total] = await Promise.all([
    prisma.scanHistory.findMany({
      where,
      include: {
        part: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.scanHistory.count({ where }),
  ]);

  return { scans, total };
}

export async function getMostScannedParts(query: ScanAnalyticsQuery & { limit?: number }) {
  const { startDate, endDate, userId, actionType, limit = 10 } = query;

  const where: any = { partId: { not: null }, success: true };

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = startDate;
    if (endDate) where.scannedAt.lte = endDate;
  }

  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;

  const results = await prisma.scanHistory.groupBy({
    by: ['partId'],
    where,
    _count: { partId: true },
    orderBy: { _count: { partId: 'desc' } },
    take: limit,
  });

  // Fetch part details for the top scanned parts
  const partIds = results.map((r) => r.partId).filter((id): id is number => id !== null);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, sku: true, name: true },
  });

  const partsMap = new Map(parts.map((p) => [p.id, p]));

  return results.map((r) => ({
    part: partsMap.get(r.partId!),
    scanCount: r._count.partId,
  }));
}

export async function getScanFrequencyOverTime(query: ScanAnalyticsQuery & { interval?: 'hour' | 'day' | 'week' | 'month' }) {
  const { startDate, endDate, userId, actionType, interval = 'day' } = query;

  const where: any = {};

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = startDate;
    if (endDate) where.scannedAt.lte = endDate;
  }

  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;

  // MySQL date formatting based on interval
  let dateFormat: string;
  switch (interval) {
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00:00';
      break;
    case 'week':
      dateFormat = '%Y-%u';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default: // day
      dateFormat = '%Y-%m-%d';
  }

  // Use raw SQL for date grouping (Prisma doesn't support DATE_FORMAT in groupBy)
  const results = await prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
    SELECT
      DATE_FORMAT(scanned_at, ${dateFormat}) as period,
      COUNT(*) as count
    FROM scan_history
    WHERE
      ${startDate ? prisma.$queryRaw`scanned_at >= ${startDate}` : prisma.$queryRaw`1=1`}
      AND ${endDate ? prisma.$queryRaw`scanned_at <= ${endDate}` : prisma.$queryRaw`1=1`}
      ${userId ? prisma.$queryRaw`AND user_id = ${userId}` : prisma.$queryRaw``}
      ${actionType ? prisma.$queryRaw`AND action_type = ${actionType}` : prisma.$queryRaw``}
    GROUP BY period
    ORDER BY period ASC
  `;

  return results.map((r) => ({
    period: r.period,
    count: Number(r.count),
  }));
}

export async function getUserScanActivity(query: ScanAnalyticsQuery & { limit?: number }) {
  const { startDate, endDate, actionType, limit = 10 } = query;

  const where: any = {};

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = startDate;
    if (endDate) where.scannedAt.lte = endDate;
  }

  if (actionType) where.actionType = actionType;

  const results = await prisma.scanHistory.groupBy({
    by: ['userId', 'userName'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  return results.map((r) => ({
    userId: r.userId,
    userName: r.userName,
    scanCount: r._count.id,
  }));
}

export async function getPeakScanningHours(query: ScanAnalyticsQuery) {
  const { startDate, endDate, userId, actionType } = query;

  const where: any = {};

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = startDate;
    if (endDate) where.scannedAt.lte = endDate;
  }

  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;

  const results = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
    SELECT
      HOUR(scanned_at) as hour,
      COUNT(*) as count
    FROM scan_history
    WHERE
      ${startDate ? prisma.$queryRaw`scanned_at >= ${startDate}` : prisma.$queryRaw`1=1`}
      AND ${endDate ? prisma.$queryRaw`scanned_at <= ${endDate}` : prisma.$queryRaw`1=1`}
      ${userId ? prisma.$queryRaw`AND user_id = ${userId}` : prisma.$queryRaw``}
      ${actionType ? prisma.$queryRaw`AND action_type = ${actionType}` : prisma.$queryRaw``}
    GROUP BY hour
    ORDER BY hour ASC
  `;

  return results.map((r) => ({
    hour: r.hour,
    count: Number(r.count),
  }));
}

export async function getScanActionTypeBreakdown(query: ScanAnalyticsQuery) {
  const { startDate, endDate, userId } = query;

  const where: any = {};

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = startDate;
    if (endDate) where.scannedAt.lte = endDate;
  }

  if (userId) where.userId = userId;

  const results = await prisma.scanHistory.groupBy({
    by: ['actionType'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return results.map((r) => ({
    actionType: r.actionType,
    count: r._count.id,
  }));
}

export async function getRecentScans(limit = 20) {
  return prisma.scanHistory.findMany({
    include: {
      part: {
        select: {
          id: true,
          sku: true,
          name: true,
        },
      },
    },
    orderBy: { scannedAt: 'desc' },
    take: limit,
  });
}
