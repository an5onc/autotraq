import { Router } from 'express';
import * as partsController from '../controllers/parts.controller.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';
import {
  createPartSchema,
  addFitmentSchema,
  partsQuerySchema,
  idParamSchema,
  fitmentParamSchema,
} from '../schemas/parts.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/parts - Create part (manager+)
router.post('/', requireManager, validateBody(createPartSchema), partsController.createPart);

// GET /api/parts - List/search parts (all authenticated users)
router.get('/', validateQuery(partsQuerySchema), partsController.getParts);

// GET /api/parts/:id - Get part by ID (all authenticated users)
router.get('/:id', validateParams(idParamSchema), partsController.getPartById);

// POST /api/parts/:id/fitments - Add fitment to part (manager+)
router.post(
  '/:id/fitments',
  requireManager,
  validateParams(idParamSchema),
  validateBody(addFitmentSchema),
  partsController.addFitment
);

// DELETE /api/parts/:id/fitments/:vehicleId - Remove fitment (manager+)
router.delete(
  '/:id/fitments/:vehicleId',
  requireManager,
  validateParams(fitmentParamSchema),
  partsController.removeFitment
);

export default router;
