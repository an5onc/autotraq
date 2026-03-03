import prisma from '../repositories/prisma.js';

/**
 * ALERTS SERVICE
 *
 * Handles alert-related operations, starting with low stock alerts.
 * Low stock is determined by comparing current inventory against minStock thresholds.
 */

export interface LowStockAlert {
  partId: number;
  sku: string;
  name: string;
  currentQty: number;
  minStock: number;
  suggestedReorder: number;
  avgMonthlyUsage: number;
  locations: Array<{
    locationId: number;
    locationName: string;
    qty: number;
  }>;
}

/**
 * Get all parts that are below their minimum stock threshold
 * Returns parts with their current quantities across all locations
 */
export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  // Get all parts with their minStock thresholds
  const parts = await prisma.part.findMany({
    where: {
      minStock: { gt: 0 } // Only check parts that have a threshold set
    },
    select: {
      id: true,
      sku: true,
      name: true,
      minStock: true
    }
  });

  const lowStockAlerts: LowStockAlert[] = [];

  // Check inventory levels for each part
  for (const part of parts) {
    // Get total quantity across all locations
    const inventoryData = await prisma.inventoryEvent.groupBy({
      by: ['locationId'],
      where: { partId: part.id },
      _sum: { qtyDelta: true }
    });

    // Get location details
    const locationQuantities = await Promise.all(
      inventoryData
        .filter(inv => (inv._sum.qtyDelta || 0) > 0)
        .map(async (inv) => {
          const location = await prisma.location.findUnique({
            where: { id: inv.locationId }
          });
          return {
            locationId: inv.locationId,
            locationName: location?.name || 'Unknown',
            qty: inv._sum.qtyDelta || 0
          };
        })
    );

    // Calculate total quantity
    const totalQty = locationQuantities.reduce((sum, loc) => sum + loc.qty, 0);

    // Add to alerts if below threshold
    if (totalQty < part.minStock) {
      // Calculate suggested reorder based on 90-day usage history
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const usageEvents = await prisma.inventoryEvent.aggregate({
        where: {
          partId: part.id,
          type: 'FULFILL',
          createdAt: { gte: ninetyDaysAgo },
        },
        _sum: { qtyDelta: true },
      });
      const totalUsed90Days = Math.abs(usageEvents._sum.qtyDelta || 0);
      const avgMonthlyUsage = Math.round(totalUsed90Days / 3);
      // Suggested: enough for 2 months + buffer to bring to minStock
      const suggestedReorder = Math.max(
        part.minStock - totalQty,
        avgMonthlyUsage * 2
      );

      lowStockAlerts.push({
        partId: part.id,
        sku: part.sku,
        name: part.name,
        currentQty: totalQty,
        minStock: part.minStock,
        suggestedReorder,
        avgMonthlyUsage,
        locations: locationQuantities
      });
    }
  }

  // Sort by severity (lowest percentage of minStock first)
  lowStockAlerts.sort((a, b) => {
    const aRatio = a.currentQty / a.minStock;
    const bRatio = b.currentQty / b.minStock;
    return aRatio - bRatio;
  });

  return lowStockAlerts;
}

/**
 * Dismiss a low stock alert for a specific part
 * This could be extended to track dismissals in a database table
 */
export async function dismissLowStockAlert(partId: number, userId: number): Promise<void> {
  // For now, this is a placeholder - in a full implementation,
  // we might track dismissed alerts in a separate table with timestamps
  // so they can be re-shown after a certain period or when stock changes

  // Future implementation could include:
  // - Track dismissals in a `alert_dismissals` table
  // - Auto-expire dismissals after X days
  // - Re-show if stock drops further

  // For MVP, the frontend will handle dismissal state
}