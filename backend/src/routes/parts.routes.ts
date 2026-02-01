import { Router } from 'express';
import * as partsController from '../controllers/parts.controller.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';
import {
  createPartSchema,
  updatePartSchema,
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

// PUT /api/parts/:id - Update part (manager+)
router.put('/:id', requireManager, validateParams(idParamSchema), validateBody(updatePartSchema), partsController.updatePart);

// DELETE /api/parts/:id - Delete part (manager+)
router.delete('/:id', requireManager, validateParams(idParamSchema), partsController.deletePart);

// POST /api/parts/:id/generate-barcode - Generate barcode (manager+)
router.post('/:id/generate-barcode', requireManager, validateParams(idParamSchema), partsController.generatePartBarcode);

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
