import { PrismaClient } from '@prisma/client';

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

export class ForecastingService {
  private readonly LEAD_TIME_DAYS = 7; // Average supplier lead time
  private readonly SAFETY_STOCK_DAYS = 5; // Buffer stock
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence threshold

  /**
   * Generate forecasts for all parts or specific part
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
   * Forecast for a single part
   */
  private async forecastPart(part: any): Promise<ForecastResult | null> {
    // Get historical sales data (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const salesHistory = await prisma.historyLog.findMany({
      where: {
        partId: part.id,
        changeType: 'SALE',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (salesHistory.length < 5) {
      // Not enough data for reliable forecast
      return null;
    }

    // Calculate daily sales statistics
    const dailySales = this.aggregateDailySales(salesHistory);
    const averageDailySales = this.calculateAverage(dailySales);
    const trend = this.calculateTrend(dailySales);
    const seasonalFactor = this.calculateSeasonalFactor(salesHistory);

    // Calculate forecast metrics
    const adjustedDailySales = averageDailySales * seasonalFactor;
    const daysUntilStockout = part.quantity > 0
      ? Math.floor(part.quantity / adjustedDailySales)
      : 0;

    // Calculate reorder point and quantity
    const reorderPoint = Math.ceil(
      adjustedDailySales * (this.LEAD_TIME_DAYS + this.SAFETY_STOCK_DAYS)
    );

    const reorderQuantity = Math.ceil(
      adjustedDailySales * 30 // Order 30 days worth
    );

    // Calculate confidence based on data consistency
    const confidence = this.calculateConfidence(dailySales);

    // Next month forecast
    const nextMonthForecast = Math.round(adjustedDailySales * 30);

    return {
      partId: part.id,
      sku: part.sku,
      name: part.name,
      currentStock: part.quantity,
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
   * Get parts that need forecasting
   */
  private async getPartsToForecast(partId?: number) {
    const where = partId ? { id: partId } : {};

    return await prisma.part.findMany({
      where: {
        ...where,
        quantity: { gt: 0 } // Only forecast parts we have in stock
      },
      include: {
        category: true
      }
    });
  }

  /**
   * Aggregate sales by day
   */
  private aggregateDailySales(salesHistory: any[]): number[] {
    const dailyMap = new Map<string, number>();

    for (const sale of salesHistory) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, current + Math.abs(sale.quantityChange));
    }

    // Fill in missing days with 0
    const days = [];
    const startDate = new Date(salesHistory[0].createdAt);
    const endDate = new Date();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      days.push(dailyMap.get(dateKey) || 0);
    }

    return days;
  }

  /**
   * Calculate average of daily sales
   */
  private calculateAverage(dailySales: number[]): number {
    if (dailySales.length === 0) return 0;
    const sum = dailySales.reduce((a, b) => a + b, 0);
    return sum / dailySales.length;
  }

  /**
   * Calculate sales trend
   */
  private calculateTrend(dailySales: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (dailySales.length < 14) return 'stable';

    // Compare last 2 weeks vs previous 2 weeks
    const midPoint = Math.floor(dailySales.length / 2);
    const firstHalf = dailySales.slice(0, midPoint);
    const secondHalf = dailySales.slice(midPoint);

    const avgFirst = this.calculateAverage(firstHalf);
    const avgSecond = this.calculateAverage(secondHalf);

    const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (changePercent > 15) return 'increasing';
    if (changePercent < -15) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate seasonal adjustment factor
   */
  private calculateSeasonalFactor(salesHistory: any[]): number {
    const currentMonth = new Date().getMonth();

    // Seasonal patterns for auto parts (simplified)
    const seasonalPatterns: SeasonalPattern[] = [
      { month: 0, factor: 0.8 },  // January - slow
      { month: 1, factor: 0.9 },  // February
      { month: 2, factor: 1.0 },  // March
      { month: 3, factor: 1.1 },  // April - spring repairs
      { month: 4, factor: 1.2 },  // May
      { month: 5, factor: 1.3 },  // June - summer driving
      { month: 6, factor: 1.3 },  // July
      { month: 7, factor: 1.2 },  // August
      { month: 8, factor: 1.1 },  // September
      { month: 9, factor: 1.0 },  // October
      { month: 10, factor: 0.9 }, // November
      { month: 11, factor: 0.8 }  // December - holidays slow
    ];

    const pattern = seasonalPatterns.find(p => p.month === currentMonth);
    return pattern ? pattern.factor : 1.0;
  }

  /**
   * Calculate forecast confidence based on data consistency
   */
  private calculateConfidence(dailySales: number[]): number {
    if (dailySales.length < 7) return this.MIN_CONFIDENCE;

    const avg = this.calculateAverage(dailySales);
    if (avg === 0) return this.MIN_CONFIDENCE;

    // Calculate coefficient of variation
    const variance = dailySales.reduce((sum, val) => {
      const diff = val - avg;
      return sum + (diff * diff);
    }, 0) / dailySales.length;

    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;

    // Lower CV = more consistent = higher confidence
    // CV of 0 = perfect consistency = 100% confidence
    // CV of 1+ = high variability = 50% confidence
    const confidence = Math.max(this.MIN_CONFIDENCE, Math.min(1, 1 - (cv / 2)));

    return confidence;
  }

  /**
   * Get parts that need immediate reordering
   */
  async getReorderAlerts(): Promise<ForecastResult[]> {
    const forecasts = await this.generateForecasts();

    return forecasts.filter(f =>
      f.currentStock <= f.reorderPoint ||
      f.daysUntilStockout <= this.LEAD_TIME_DAYS
    );
  }

  /**
   * Get seasonal demand patterns for a category
   */
  async getCategorySeasonalDemand(categoryId: number): Promise<any> {
    const parts = await prisma.part.findMany({
      where: { categoryId }
    });

    const monthlyDemand = new Array(12).fill(0);

    for (const part of parts) {
      const sales = await prisma.historyLog.findMany({
        where: {
          partId: part.id,
          changeType: 'SALE',
          createdAt: {
            gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          }
        }
      });

      sales.forEach(sale => {
        const month = sale.createdAt.getMonth();
        monthlyDemand[month] += Math.abs(sale.quantityChange);
      });
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return months.map((month, index) => ({
      month,
      demand: monthlyDemand[index]
    }));
  }

  /**
   * Generate automated purchase orders based on forecasts
   */
  async generatePurchaseOrders(): Promise<any[]> {
    const reorderAlerts = await this.getReorderAlerts();
    const orders: any[] = [];

    // Group by supplier
    const supplierGroups = new Map<number, ForecastResult[]>();

    for (const alert of reorderAlerts) {
      const part = await prisma.part.findUnique({
        where: { id: alert.partId },
        include: { supplier: true }
      });

      if (part?.supplierId) {
        const group = supplierGroups.get(part.supplierId) || [];
        group.push(alert);
        supplierGroups.set(part.supplierId, group);
      }
    }

    // Create purchase orders for each supplier
    for (const [supplierId, parts] of supplierGroups) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (supplier) {
        const orderItems = parts.map(p => ({
          partId: p.partId,
          sku: p.sku,
          name: p.name,
          quantity: p.reorderQuantity,
          reorderReason: `Stock at ${p.currentStock}, ${p.daysUntilStockout} days until stockout`
        }));

        orders.push({
          supplierId,
          supplierName: supplier.name,
          items: orderItems,
          totalItems: orderItems.length,
          estimatedDelivery: new Date(Date.now() + this.LEAD_TIME_DAYS * 24 * 60 * 60 * 1000)
        });
      }
    }

    return orders;
  }
}

export default new ForecastingService();