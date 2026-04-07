import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import forecastingService from '../services/forecasting';

const router = Router();

// Get forecasts for all parts
router.get('/forecasts', authenticate, async (req, res) => {
  try {
    const { partId } = req.query;
    const forecasts = await forecastingService.generateForecasts(
      partId ? parseInt(partId as string) : undefined
    );

    res.json({
      success: true,
      count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Error generating forecasts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate forecasts'
    });
  }
});

// Get parts at risk of stockout in next 30 days
router.get('/stockout-risk', authenticate, async (req, res) => {
  try {
    const atRisk = await forecastingService.getStockoutRisk(30);

    res.json({
      success: true,
      count: atRisk.length,
      riskLevel: {
        critical: atRisk.filter((p) => p.daysUntilStockout <= 7).length,
        warning: atRisk.filter((p) => p.daysUntilStockout > 7 && p.daysUntilStockout <= 14).length,
        moderate: atRisk.filter((p) => p.daysUntilStockout > 14 && p.daysUntilStockout <= 30).length
      },
      parts: atRisk
    });
  } catch (error) {
    console.error('Error getting stockout risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stockout risk analysis'
    });
  }
});

// Get reorder alerts
router.get('/reorder-alerts', authenticate, async (req, res) => {
  try {
    const alerts = await forecastingService.getReorderAlerts();

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error getting reorder alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reorder alerts'
    });
  }
});

// Get seasonal demand for a category
router.get('/seasonal-demand/:categoryId', authenticate, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const demand = await forecastingService.getCategorySeasonalDemand(categoryId);

    res.json({
      success: true,
      categoryId,
      demand
    });
  } catch (error) {
    console.error('Error getting seasonal demand:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seasonal demand'
    });
  }
});

// Get all seasonal demand patterns (for dashboard)
router.get('/seasonal-demand-all', authenticate, async (req, res) => {
  try {
    const patterns = await forecastingService.getAllSeasonalPatterns();

    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Error getting seasonal patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seasonal patterns'
    });
  }
});

// Get dashboard summary
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const summary = await forecastingService.getDashboardSummary();

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard summary'
    });
  }
});

// Generate purchase orders (Manager/Admin only)
router.post(
  '/generate-orders',
  authenticate,
  requireRoles('admin', 'manager'),
  async (req, res) => {
    try {
      const orders = await forecastingService.generatePurchaseOrders();

      res.json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (error) {
      console.error('Error generating purchase orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate purchase orders'
      });
    }
  }
);

export default router;