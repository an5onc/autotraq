import { Router } from 'express';
import * as scanHistoryController from '../controllers/scanHistory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/scan-history - Log a scan
router.post('/', scanHistoryController.logScan);

// GET /api/scan-history - Get scan history with filters
router.get('/', scanHistoryController.getScanHistory);

// GET /api/scan-history/analytics - Get all analytics data
router.get('/analytics', scanHistoryController.getAnalytics);

// GET /api/scan-history/most-scanned - Get most scanned parts
router.get('/most-scanned', scanHistoryController.getMostScannedParts);

// GET /api/scan-history/frequency - Get scan frequency over time
router.get('/frequency', scanHistoryController.getScanFrequency);

// GET /api/scan-history/user-activity - Get user scan activity
router.get('/user-activity', scanHistoryController.getUserActivity);

// GET /api/scan-history/peak-hours - Get peak scanning hours
router.get('/peak-hours', scanHistoryController.getPeakHours);

export default router;
