import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate, requireManager, requireFulfillment } from '../middleware/auth.middleware.js';
import {
  receiveStockSchema,
  correctStockSchema,
  returnStockSchema,
  onHandQuerySchema,
  eventsQuerySchema,
  createLocationSchema,
} from '../schemas/inventory.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/locations - Create location (manager+)
router.post('/locations', requireManager, validateBody(createLocationSchema), inventoryController.createLocation);

// GET /api/locations - List locations (all authenticated users)
router.get('/locations', inventoryController.getLocations);

// POST /api/inventory/receive - Receive stock (fulfillment+)
router.post('/receive', requireFulfillment, validateBody(receiveStockSchema), inventoryController.receiveStock);

// POST /api/inventory/correct - Correction (manager+)
router.post('/correct', requireManager, validateBody(correctStockSchema), inventoryController.correctStock);

// POST /api/inventory/return - Return stock (fulfillment+)
router.post('/return', requireFulfillment, validateBody(returnStockSchema), inventoryController.returnStock);

// GET /api/inventory/on-hand - Get on-hand quantities (all authenticated users)
router.get('/on-hand', validateQuery(onHandQuerySchema), inventoryController.getOnHand);

// GET /api/inventory/events - Get event history (all authenticated users)
router.get('/events', validateQuery(eventsQuerySchema), inventoryController.getEvents);

// GET /api/inventory/history - Get inventory levels over time (for charts)
router.get('/history', inventoryController.getHistory);

// GET /api/inventory/top-movers - Get most active parts
router.get('/top-movers', inventoryController.getTopMovers);

// GET /api/inventory/dead-stock - Get parts with no recent activity
router.get('/dead-stock', inventoryController.getDeadStock);

export default router;
