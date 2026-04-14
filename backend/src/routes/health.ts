import { Router } from 'express';
import { PrismaClient, InventoryEventType } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

interface HealthMetrics {
  overallScore: number;
  metrics: {
    stockAccuracy: number;
    turnoverRate: number;
    deadStockPercentage: number;
    reorderCompliance: number;
    auditFrequency: number;
  };
  issues: {
    critical: string[];
    warnings: string[];
    suggestions: string[];
  };
  trends: {
    label: string;
    direction: 'up' | 'down' | 'stable';
    value: number;
    change: number;
  }[];
}

// Compute stock per part from inventory events
async function getStockByPart(): Promise<Map<number, number>> {
  const aggregates = await prisma.inventoryEvent.groupBy({
    by: ['partId'],
    _sum: { qtyDelta: true }
  });
  return new Map(aggregates.map(r => [r.partId, r._sum.qtyDelta ?? 0]));
}

// Get inventory health metrics
router.get('/dashboard', authenticate, async (_req: AuthenticatedRequest, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [parts, stockMap, recentOutEvents, recentInEvents] = await Promise.all([
      prisma.part.findMany({ select: { id: true, minStock: true } }),
      getStockByPart(),
      // Outbound events (fulfillments) in last 90 days
      prisma.inventoryEvent.findMany({
        where: { type: InventoryEventType.FULFILL, createdAt: { gte: ninetyDaysAgo } },
        select: { partId: true }
      }),
      // Inbound events in last 90 days
      prisma.inventoryEvent.findMany({
        where: { type: InventoryEventType.RECEIVE, createdAt: { gte: ninetyDaysAgo } },
        select: { partId: true }
      })
    ]);

    const outPartIds = new Set(recentOutEvents.map(e => e.partId));
    const inPartIds = new Set(recentInEvents.map(e => e.partId));

    // Turnover: parts with outbound activity / total parts
    const turnoverRate = parts.length > 0
      ? (outPartIds.size / parts.length) * 12 // Annualized
      : 0;

    // Dead stock: parts with stock > 0 but no outbound activity in 90 days
    const deadStockParts = parts.filter(p => {
      const qty = stockMap.get(p.id) ?? 0;
      return qty > 0 && !outPartIds.has(p.id);
    });
    const deadStockPercentage = parts.length > 0
      ? (deadStockParts.length / parts.length) * 100
      : 0;

    // Reorder compliance: parts below minStock that received stock
    const belowMinStock = parts.filter(p => (stockMap.get(p.id) ?? 0) <= p.minStock);
    const compliantReorders = belowMinStock.filter(p => inPartIds.has(p.id));
    const reorderCompliance = belowMinStock.length > 0
      ? (compliantReorders.length / belowMinStock.length) * 100
      : 100;

    // No audit model — default to 100
    const stockAccuracy = 100;
    const auditFrequency = 100;

    const overallScore = Math.round(
      (stockAccuracy * 0.25) +
      (Math.min(turnoverRate * 10, 100) * 0.20) +
      ((100 - deadStockPercentage) * 0.20) +
      (reorderCompliance * 0.20) +
      (auditFrequency * 0.15)
    );

    const issues = {
      critical: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[]
    };

    if (deadStockPercentage > 20) {
      issues.critical.push(`${deadStockPercentage.toFixed(1)}% of inventory is dead stock`);
    }
    if (reorderCompliance < 80) {
      issues.warnings.push(`Only ${reorderCompliance.toFixed(1)}% reorder compliance - review ordering process`);
    }
    if (turnoverRate < 4) {
      issues.warnings.push('Low inventory turnover rate - review stocking levels');
    }

    const trends = [
      {
        label: 'Turnover Rate',
        direction: turnoverRate > 6 ? 'up' as const : turnoverRate < 4 ? 'down' as const : 'stable' as const,
        value: turnoverRate,
        change: 0
      },
      {
        label: 'Dead Stock',
        direction: deadStockPercentage < 10 ? 'down' as const : deadStockPercentage > 20 ? 'up' as const : 'stable' as const,
        value: deadStockPercentage,
        change: 0
      },
      {
        label: 'Reorder Compliance',
        direction: reorderCompliance > 90 ? 'up' as const : reorderCompliance < 70 ? 'down' as const : 'stable' as const,
        value: reorderCompliance,
        change: 0
      }
    ];

    const healthMetrics: HealthMetrics = {
      overallScore,
      metrics: {
        stockAccuracy: Math.round(stockAccuracy * 10) / 10,
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        deadStockPercentage: Math.round(deadStockPercentage * 10) / 10,
        reorderCompliance: Math.round(reorderCompliance * 10) / 10,
        auditFrequency: Math.round(auditFrequency * 10) / 10
      },
      issues,
      trends
    };

    res.json(healthMetrics);
  } catch (error) {
    console.error('Error calculating health metrics:', error);
    res.status(500).json({ error: 'Failed to calculate health metrics' });
  }
});

// Get parts needing attention
router.get('/alerts', authenticate, async (_req: AuthenticatedRequest, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [parts, stockMap, recentOutPartIds] = await Promise.all([
      prisma.part.findMany({ select: { id: true, sku: true, name: true, minStock: true } }),
      getStockByPart(),
      prisma.inventoryEvent.findMany({
        where: { type: InventoryEventType.FULFILL, createdAt: { gte: ninetyDaysAgo } },
        select: { partId: true }
      }).then(rows => new Set(rows.map(r => r.partId)))
    ]);

    // Low stock: quantity <= minStock
    const lowStockParts = parts
      .map(p => ({ ...p, stockOnHand: stockMap.get(p.id) ?? 0 }))
      .filter(p => p.stockOnHand <= p.minStock)
      .sort((a, b) => a.stockOnHand - b.stockOnHand)
      .slice(0, 10);

    // Dead stock: quantity > 0, no outbound in 90 days
    const deadStockParts = parts
      .map(p => ({ ...p, stockOnHand: stockMap.get(p.id) ?? 0 }))
      .filter(p => p.stockOnHand > 0 && !recentOutPartIds.has(p.id))
      .sort((a, b) => b.stockOnHand - a.stockOnHand)
      .slice(0, 10);

    res.json({
      lowStock: lowStockParts,
      deadStock: deadStockParts,
      needsAudit: [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get health score history (mock - no stored metrics)
router.get('/history', authenticate, async (_req: AuthenticatedRequest, res) => {
  try {
    const history = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        overallScore: 75 + Math.random() * 20,
        stockAccuracy: 100,
        turnoverRate: 4 + Math.random() * 4,
        deadStockPercentage: 10 + Math.random() * 15
      });
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
