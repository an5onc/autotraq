import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/roles';
import forecastingService from '../services/forecasting';

const router = Router();

// Get forecasts for all parts
router.get('/forecasts', authenticateToken, async (req, res) => {
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

// Get reorder alerts
router.get('/reorder-alerts', authenticateToken, async (req, res) => {
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
router.get('/seasonal-demand/:categoryId', authenticateToken, async (req, res) => {
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

// Generate purchase orders (Manager/Admin only)
router.post(
  '/generate-orders',
  authenticateToken,
  checkRole(['MANAGER', 'ADMIN']),
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