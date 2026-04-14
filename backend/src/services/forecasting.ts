import { PrismaClient, InventoryEventType } from '@prisma/client';

const prisma = new PrismaClient();

interface ForecastResult {
  partId: number;
  sku: string;
  name: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilStockout: number;
  reorderPoint: number;
  reorderQuantity: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  seasonalFactor: number;
  nextMonthForecast: number;
}

interface SeasonalPattern {
  month: number;
  factor: number;
}

// Part with computed stock quantity
interface PartWithStock {
  id: number;
  sku: string;
  name: string;
  minStock: number;
  computedQuantity: number;
}

export class ForecastingService {
  private readonly LEAD_TIME_DAYS = 7;
  private readonly SAFETY_STOCK_DAYS = 5;
  private readonly MIN_CONFIDENCE = 0.5;

  /**
   * Generate forecasts for all parts or a specific part
   */
  async generateForecasts(partId?: number): Promise<ForecastResult[]> {
    const parts = await this.getPartsToForecast(partId);
    const forecasts: ForecastResult[] = [];

    for (const part of parts) {
      const forecast = await this.forecastPart(part);
      if (forecast) {
        forecasts.push(forecast);
      }
    }

    return forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }

  /**
   * Forecast for a single part using InventoryEvent history
   */
  private async forecastPart(part: PartWithStock): Promise<ForecastResult | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Use FULFILL events as proxy for outbound/sales activity
    const fulfillEvents = await prisma.inventoryEvent.findMany({
      where: {
        partId: part.id,
        type: InventoryEventType.FULFILL,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (fulfillEvents.length < 5) {
      return null; // Not enough data
    }

    const dailySales = this.aggregateDailySales(fulfillEvents);
    const averageDailySales = this.calculateAverage(dailySales);
    const trend = this.calculateTrend(dailySales);
    const seasonalFactor = this.calculateSeasonalFactor();

    const adjustedDailySales = averageDailySales * seasonalFactor;
    const daysUntilStockout = part.computedQuantity > 0 && adjustedDailySales > 0
      ? Math.floor(part.computedQuantity / adjustedDailySales)
      : part.computedQuantity > 0 ? 999 : 0;

    const reorderPoint = Math.ceil(
      adjustedDailySales * (this.LEAD_TIME_DAYS + this.SAFETY_STOCK_DAYS)
    );

    const reorderQuantity = Math.max(
      Math.ceil(adjustedDailySales * 30),
      part.minStock
    );

    const confidence = this.calculateConfidence(dailySales);
    const nextMonthForecast = Math.round(adjustedDailySales * 30);

    return {
      partId: part.id,
      sku: part.sku,
      name: part.name,
      currentStock: part.computedQuantity,
      averageDailySales: Number(averageDailySales.toFixed(2)),
      daysUntilStockout,
      reorderPoint,
      reorderQuantity,
      confidence: Number(confidence.toFixed(2)),
      trend,
      seasonalFactor: Number(seasonalFactor.toFixed(2)),
      nextMonthForecast
    };
  }

  /**
   * Get parts with their computed stock quantities
   */
  private async getPartsToForecast(partId?: number): Promise<PartWithStock[]> {
    const where = partId ? { id: partId } : {};

    const [parts, stockAggregates] = await Promise.all([
      prisma.part.findMany({
        where,
        select: { id: true, sku: true, name: true, minStock: true }
      }),
      prisma.inventoryEvent.groupBy({
        by: ['partId'],
        where: partId ? { partId } : {},
        _sum: { qtyDelta: true }
      })
    ]);

    const stockMap = new Map(stockAggregates.map(s => [s.partId, s._sum.qtyDelta ?? 0]));

    return parts
      .map(p => ({ ...p, computedQuantity: stockMap.get(p.id) ?? 0 }))
      .filter(p => p.computedQuantity > 0);
  }

  private aggregateDailySales(events: { createdAt: Date; qtyDelta: number }[]): number[] {
    const dailyMap = new Map<string, number>();

    for (const event of events) {
      const dateKey = event.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, current + Math.abs(event.qtyDelta));
    }

    const days: number[] = [];
    const startDate = new Date(events[0].createdAt);
    const endDate = new Date();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      days.push(dailyMap.get(dateKey) || 0);
    }

    return days;
  }

  private calculateAverage(dailySales: number[]): number {
    if (dailySales.length === 0) return 0;
    return dailySales.reduce((a, b) => a + b, 0) / dailySales.length;
  }

  private calculateTrend(dailySales: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (dailySales.length < 14) return 'stable';

    const midPoint = Math.floor(dailySales.length / 2);
    const avgFirst = this.calculateAverage(dailySales.slice(0, midPoint));
    const avgSecond = this.calculateAverage(dailySales.slice(midPoint));

    if (avgFirst === 0) return 'stable';
    const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (changePercent > 15) return 'increasing';
    if (changePercent < -15) return 'decreasing';
    return 'stable';
  }

  private calculateSeasonalFactor(): number {
    const currentMonth = new Date().getMonth();
    const seasonalPatterns: SeasonalPattern[] = [
      { month: 0, factor: 0.8 },
      { month: 1, factor: 0.9 },
      { month: 2, factor: 1.0 },
      { month: 3, factor: 1.1 },
      { month: 4, factor: 1.2 },
      { month: 5, factor: 1.3 },
      { month: 6, factor: 1.3 },
      { month: 7, factor: 1.2 },
      { month: 8, factor: 1.1 },
      { month: 9, factor: 1.0 },
      { month: 10, factor: 0.9 },
      { month: 11, factor: 0.8 }
    ];
    return seasonalPatterns.find(p => p.month === currentMonth)?.factor ?? 1.0;
  }

  private calculateConfidence(dailySales: number[]): number {
    if (dailySales.length < 7) return this.MIN_CONFIDENCE;
    const avg = this.calculateAverage(dailySales);
    if (avg === 0) return this.MIN_CONFIDENCE;

    const variance = dailySales.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dailySales.length;
    const cv = Math.sqrt(variance) / avg;
    return Math.max(this.MIN_CONFIDENCE, Math.min(1, 1 - (cv / 2)));
  }

  async getReorderAlerts(): Promise<ForecastResult[]> {
    const forecasts = await this.generateForecasts();
    return forecasts.filter(f =>
      f.currentStock <= f.reorderPoint ||
      f.daysUntilStockout <= this.LEAD_TIME_DAYS
    );
  }

  async getStockoutRisk(days: number): Promise<ForecastResult[]> {
    const forecasts = await this.generateForecasts();
    return forecasts.filter(f => f.daysUntilStockout <= days)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }

  async getAllSeasonalPatterns(): Promise<any[]> {
    // Category model not in schema — return empty
    return [];
  }

  async getDashboardSummary(): Promise<any> {
    const forecasts = await this.generateForecasts();
    const critical = forecasts.filter(f => f.daysUntilStockout <= 7);
    const warning = forecasts.filter(f => f.daysUntilStockout > 7 && f.daysUntilStockout <= 30);

    const increasing = forecasts.filter(f => f.trend === 'increasing').length;
    const decreasing = forecasts.filter(f => f.trend === 'decreasing').length;
    const stable = forecasts.filter(f => f.trend === 'stable').length;

    const avgConfidence = forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
      : 0;

    const totalReorderQty = forecasts
      .filter(f => f.currentStock <= f.reorderPoint)
      .reduce((sum, f) => sum + f.reorderQuantity, 0);

    return {
      totalParts: forecasts.length,
      criticalParts: critical.length,
      warningParts: warning.length,
      partsAtRisk30Days: forecasts.filter(f => f.daysUntilStockout <= 30).length,
      avgConfidence: Number(avgConfidence.toFixed(2)),
      trendBreakdown: { increasing, stable, decreasing },
      totalReorderQtyNeeded: totalReorderQty,
      highestRiskParts: critical.slice(0, 5),
      estimatedStockoutValue: critical.reduce((sum, f) => sum + (f.reorderQuantity * 50), 0)
    };
  }

  async generatePurchaseOrders(): Promise<any[]> {
    // Supplier model not in schema — return empty
    return [];
  }
}

export default new ForecastingService();
