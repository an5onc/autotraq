import { Router } from 'express';
import * as vehiclesController from '../controllers/vehicles.controller.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';
import { createVehicleSchema, vehiclesQuerySchema } from '../schemas/vehicles.schema.js';
import { idParamSchema } from '../schemas/parts.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/vehicles - Create vehicle (manager+)
router.post('/', requireManager, validateBody(createVehicleSchema), vehiclesController.createVehicle);

// GET /api/vehicles - List/search vehicles (all authenticated users)
router.get('/', validateQuery(vehiclesQuerySchema), vehiclesController.getVehicles);

// GET /api/vehicles/makes - Get distinct makes for a year
router.get('/makes', vehiclesController.getMakes);

// GET /api/vehicles/models - Get distinct models for year+make
router.get('/models', vehiclesController.getModels);

// GET /api/vehicles/:id - Get vehicle by ID (all authenticated users)
router.get('/:id', validateParams(idParamSchema), vehiclesController.getVehicleById);

export default router;
