import { Router } from 'express';
import authRoutes from './auth.routes.js';
import partsRoutes from './parts.routes.js';
import vehiclesRoutes from './vehicles.routes.js';
import interchangeRoutes from './interchange.routes.js';
import inventoryRoutes from './inventory.routes.js';
import requestsRoutes from './requests.routes.js';
import skuRoutes from './sku.routes.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as interchangeController from '../controllers/interchange.controller.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/parts', partsRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/interchange-groups', interchangeRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/locations', inventoryRoutes); // Locations are under inventory routes
router.use('/requests', requestsRoutes);
router.use('/sku', skuRoutes);

// Additional utility route: get interchangeable parts for a specific part
router.get(
  '/parts/:partId/interchangeable',
  authenticate,
  interchangeController.getInterchangeableParts
);

export default router;
