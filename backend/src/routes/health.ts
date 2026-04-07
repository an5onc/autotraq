import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

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

// Get inventory health metrics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get all parts with recent activity
    const parts = await prisma.part.findMany({
      include: {
        movements: {
          where: {
            createdAt: {
              gte: ninetyDaysAgo
            }
          }
        },
        audits: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    // Calculate stock accuracy (based on audits)
    const auditedParts = parts.filter(p => p.audits.length > 0);
    const accurateAudits = auditedParts.filter(p => {
      const lastAudit = p.audits[p.audits.length - 1];
      return Math.abs(lastAudit.countedQuantity - lastAudit.systemQuantity) <= 2;
    });
    const stockAccuracy = auditedParts.length > 0
      ? (accurateAudits.length / auditedParts.length) * 100
      : 100;

    // Calculate turnover rate
    const totalMovements = parts.reduce((sum, p) => sum + p.movements.filter(m => m.type === 'OUT').length, 0);
    const averageStock = parts.reduce((sum, p) => sum + p.quantity, 0) / parts.length;
    const turnoverRate = averageStock > 0 ? (totalMovements / averageStock) * 12 : 0; // Annualized

    // Calculate dead stock percentage
    const deadStockParts = parts.filter(p => {
      const outMovements = p.movements.filter(m => m.type === 'OUT');
      return outMovements.length === 0 && p.quantity > 0;
    });
    const deadStockPercentage = parts.length > 0
      ? (deadStockParts.length / parts.length) * 100
      : 0;

    // Calculate reorder compliance
    const belowReorderParts = parts.filter(p => p.quantity <= p.reorderPoint);
    const orderedParts = belowReorderParts.filter(p => {
      const recentOrders = p.movements.filter(m =>
        m.type === 'IN' &&
        m.createdAt >= thirtyDaysAgo
      );
      return recentOrders.length > 0;
    });
    const reorderCompliance = belowReorderParts.length > 0
      ? (orderedParts.length / belowReorderParts.length) * 100
      : 100;

    // Calculate audit frequency score
    const partsWithRecentAudits = parts.filter(p => p.audits.length > 0);
    const auditFrequency = (partsWithRecentAudits.length / parts.length) * 100;

    // Calculate overall health score
    const overallScore = Math.round(
      (stockAccuracy * 0.25) +
      (Math.min(turnoverRate * 10, 100) * 0.20) +
      ((100 - deadStockPercentage) * 0.20) +
      (reorderCompliance * 0.20) +
      (auditFrequency * 0.15)
    );

    // Identify issues
    const issues = {
      critical: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[]
    };

    if (stockAccuracy < 90) {
      issues.critical.push(`Stock accuracy is ${stockAccuracy.toFixed(1)}% - conduct full inventory audit`);
    }
    if (deadStockPercentage > 20) {
      issues.critical.push(`${deadStockPercentage.toFixed(1)}% of inventory is dead stock`);
    }
    if (reorderCompliance < 80) {
      issues.warnings.push(`Only ${reorderCompliance.toFixed(1)}% reorder compliance - review ordering process`);
    }
    if (turnoverRate < 4) {
      issues.warnings.push('Low inventory turnover rate - review stocking levels');
    }
    if (auditFrequency < 50) {
      issues.suggestions.push('Increase audit frequency for better accuracy');
    }

    // Calculate trends (mock data for now)
    const trends = [
      {
        label: 'Stock Accuracy',
        direction: stockAccuracy > 95 ? 'up' as const : stockAccuracy < 90 ? 'down' as const : 'stable' as const,
        value: stockAccuracy,
        change: Math.random() * 10 - 5
      },
      {
        label: 'Turnover Rate',
        direction: turnoverRate > 6 ? 'up' as const : turnoverRate < 4 ? 'down' as const : 'stable' as const,
        value: turnoverRate,
        change: Math.random() * 2 - 1
      },
      {
        label: 'Dead Stock',
        direction: deadStockPercentage < 10 ? 'down' as const : deadStockPercentage > 20 ? 'up' as const : 'stable' as const,
        value: deadStockPercentage,
        change: Math.random() * 5 - 2.5
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
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find parts below reorder point
    const lowStockParts = await prisma.part.findMany({
      where: {
        quantity: {
          lte: prisma.part.fields.reorderPoint
        }
      },
      orderBy: {
        quantity: 'asc'
      },
      take: 10
    });

    // Find dead stock
    const deadStockParts = await prisma.part.findMany({
      where: {
        quantity: {
          gt: 0
        },
        movements: {
          none: {
            type: 'OUT',
            createdAt: {
              gte: ninetyDaysAgo
            }
          }
        }
      },
      orderBy: {
        quantity: 'desc'
      },
      take: 10
    });

    // Find parts never audited
    const unauditedParts = await prisma.part.findMany({
      where: {
        audits: {
          none: {}
        },
        quantity: {
          gt: 0
        }
      },
      orderBy: {
        quantity: 'desc'
      },
      take: 10
    });

    res.json({
      lowStock: lowStockParts,
      deadStock: deadStockParts,
      needsAudit: unauditedParts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get health score history
router.get('/history', authenticate, async (req, res) => {
  try {
    // Generate mock historical data (in production, this would come from stored metrics)
    const history = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      history.push({
        date: date.toISOString().split('T')[0],
        overallScore: 75 + Math.random() * 20,
        stockAccuracy: 85 + Math.random() * 15,
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