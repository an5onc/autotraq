import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import prisma from '../repositories/prisma.js';

const router = Router();
router.use(authenticate);

interface ReorderSuggestion {
  partId: number;
  sku: string;
  name: string;
  condition: string;
  currentStock: number;
  minStock: number;
  stockDifference: number;
  avgDailyUsage: number;
  suggestedReorderQty: number;
  daysOfStockRemaining: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  costPerUnit: number;
  totalReorderCost: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * GET /api/reorder/suggestions
 *
 * Generates intelligent reorder suggestions based on:
 * - Current stock vs minimum stock threshold
 * - Historical usage patterns (last 30/60/90 days)
 * - Average daily consumption rate
 * - Days of stock remaining
 * - Lead time considerations
 *
 * Priority levels:
 * - CRITICAL: Out of stock or < 3 days remaining
 * - HIGH: < 7 days remaining
 * - MEDIUM: < 14 days remaining
 * - LOW: Below min but > 14 days remaining
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 60;
    const leadTimeDays = parseInt(req.query.leadTimeDays as string) || 7;

    // Get all parts with their min stock thresholds
    const parts = await prisma.part.findMany({
      where: { minStock: { gt: 0 } },
      select: {
        id: true,
        sku: true,
        name: true,
        condition: true,
        minStock: true,
        costCents: true,
      },
    });

    // Get current inventory levels
    const inventoryEvents = await prisma.inventoryEvent.groupBy({
      by: ['partId'],
      where: { partId: { in: parts.map(p => p.id) } },
      _sum: { qtyDelta: true },
    });
    const currentStockMap = new Map(
      inventoryEvents.map(e => [e.partId, e._sum.qtyDelta || 0])
    );

    // Calculate usage patterns over lookback period
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const recentEvents = await prisma.inventoryEvent.findMany({
      where: {
        partId: { in: parts.map(p => p.id) },
        createdAt: { gte: lookbackDate },
        type: { in: ['FULFILL', 'RECEIVE'] },
      },
      select: {
        partId: true,
        type: true,
        qtyDelta: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group events by part and calculate usage
    const usageByPart = new Map<number, { totalFulfilled: number; lastReceiveDate: Date | null }>();

    for (const event of recentEvents) {
      const current = usageByPart.get(event.partId) || { totalFulfilled: 0, lastReceiveDate: null };

      if (event.type === 'FULFILL') {
        current.totalFulfilled += Math.abs(event.qtyDelta);
      } else if (event.type === 'RECEIVE') {
        if (!current.lastReceiveDate || event.createdAt > current.lastReceiveDate) {
          current.lastReceiveDate = event.createdAt;
        }
      }

      usageByPart.set(event.partId, current);
    }

    // Build reorder suggestions
    const suggestions: ReorderSuggestion[] = [];

    for (const part of parts) {
      const currentStock = currentStockMap.get(part.id) || 0;
      const stockDifference = currentStock - part.minStock;

      // Skip if stock is adequate
      if (stockDifference >= 0) continue;

      const usage = usageByPart.get(part.id) || { totalFulfilled: 0, lastReceiveDate: null };
      const avgDailyUsage = usage.totalFulfilled / lookbackDays;

      // Calculate days of stock remaining (avoid division by zero)
      const daysOfStockRemaining = avgDailyUsage > 0
        ? Math.max(0, currentStock / avgDailyUsage)
        : 999;

      // Calculate suggested reorder quantity
      // Formula: (min stock * 2) - current stock + (avg daily usage * lead time)
      // This ensures we have safety stock plus coverage for lead time
      const safetyStock = part.minStock * 2;
      const leadTimeBuffer = avgDailyUsage * leadTimeDays;
      const suggestedReorderQty = Math.ceil(
        Math.max(
          safetyStock - currentStock + leadTimeBuffer,
          part.minStock - currentStock // At minimum, get to min stock
        )
      );

      // Determine priority
      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      if (currentStock <= 0 || daysOfStockRemaining < 3) {
        priority = 'CRITICAL';
      } else if (daysOfStockRemaining < 7) {
        priority = 'HIGH';
      } else if (daysOfStockRemaining < 14) {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }

      // Calculate costs
      const costPerUnit = (part.costCents || 0) / 100;
      const totalReorderCost = costPerUnit * suggestedReorderQty;

      // Calculate days since last order
      let daysSinceLastOrder: number | null = null;
      if (usage.lastReceiveDate) {
        const diffTime = new Date().getTime() - usage.lastReceiveDate.getTime();
        daysSinceLastOrder = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      suggestions.push({
        partId: part.id,
        sku: part.sku,
        name: part.name,
        condition: part.condition,
        currentStock,
        minStock: part.minStock,
        stockDifference,
        avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
        suggestedReorderQty,
        daysOfStockRemaining: parseFloat(daysOfStockRemaining.toFixed(1)),
        lastOrderDate: usage.lastReceiveDate?.toISOString() || null,
        daysSinceLastOrder,
        costPerUnit,
        totalReorderCost: parseFloat(totalReorderCost.toFixed(2)),
        priority,
      });
    }

    // Sort by priority (CRITICAL first) then by days remaining
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    suggestions.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.daysOfStockRemaining - b.daysOfStockRemaining;
    });

    // Calculate summary stats
    const summary = {
      totalPartsNeedingReorder: suggestions.length,
      criticalCount: suggestions.filter(s => s.priority === 'CRITICAL').length,
      highCount: suggestions.filter(s => s.priority === 'HIGH').length,
      mediumCount: suggestions.filter(s => s.priority === 'MEDIUM').length,
      lowCount: suggestions.filter(s => s.priority === 'LOW').length,
      totalReorderCost: suggestions.reduce((sum, s) => sum + s.totalReorderCost, 0),
      totalUnitsToOrder: suggestions.reduce((sum, s) => sum + s.suggestedReorderQty, 0),
    };

    res.json({
      suggestions,
      summary,
      lookbackDays,
      leadTimeDays,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Reorder suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate reorder suggestions' });
  }
});

/**
 * GET /api/reorder/analytics/:partId
 *
 * Detailed usage analytics for a specific part
 */
router.get('/analytics/:partId', async (req: Request, res: Response) => {
  try {
    const partId = parseInt(req.params.partId);
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 90;

    const part = await prisma.part.findUnique({
      where: { id: partId },
      select: {
        id: true,
        sku: true,
        name: true,
        condition: true,
        minStock: true,
        costCents: true,
      },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Get all events for this part in lookback period
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const events = await prisma.inventoryEvent.findMany({
      where: {
        partId,
        createdAt: { gte: lookbackDate },
      },
      select: {
        type: true,
        qtyDelta: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build daily usage data
    const dailyData: { [date: string]: { received: number; fulfilled: number; net: number } } = {};

    events.forEach(event => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { received: 0, fulfilled: 0, net: 0 };
      }

      if (event.type === 'RECEIVE') {
        dailyData[date].received += event.qtyDelta;
      } else if (event.type === 'FULFILL') {
        dailyData[date].fulfilled += Math.abs(event.qtyDelta);
      }
      dailyData[date].net += event.qtyDelta;
    });

    // Calculate stats
    const totalReceived = events
      .filter(e => e.type === 'RECEIVE')
      .reduce((sum, e) => sum + e.qtyDelta, 0);

    const totalFulfilled = events
      .filter(e => e.type === 'FULFILL')
      .reduce((sum, e) => sum + Math.abs(e.qtyDelta), 0);

    const avgDailyUsage = totalFulfilled / lookbackDays;
    const avgDailyReceival = totalReceived / lookbackDays;

    res.json({
      part,
      analytics: {
        lookbackDays,
        totalReceived,
        totalFulfilled,
        avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
        avgDailyReceival: parseFloat(avgDailyReceival.toFixed(2)),
        eventCount: events.length,
        dailyData,
      },
    });

  } catch (err) {
    console.error('Part analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
