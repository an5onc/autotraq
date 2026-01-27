import { Router } from 'express';
import * as requestsController from '../controllers/requests.controller.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { authenticate, requireManager, requireFulfillment } from '../middleware/auth.middleware.js';
import { createRequestSchema, requestsQuerySchema } from '../schemas/requests.schema.js';
import { idParamSchema } from '../schemas/parts.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/requests - Create request (all authenticated users)
router.post('/', validateBody(createRequestSchema), requestsController.createRequest);

// GET /api/requests - List requests (all authenticated users)
router.get('/', validateQuery(requestsQuerySchema), requestsController.getRequests);

// GET /api/requests/:id - Get request by ID (all authenticated users)
router.get('/:id', validateParams(idParamSchema), requestsController.getRequestById);

// POST /api/requests/:id/approve - Approve request (manager+)
router.post('/:id/approve', requireManager, validateParams(idParamSchema), requestsController.approveRequest);

// POST /api/requests/:id/fulfill - Fulfill request (fulfillment+)
router.post('/:id/fulfill', requireFulfillment, validateParams(idParamSchema), requestsController.fulfillRequest);

// POST /api/requests/:id/cancel - Cancel request (manager+)
router.post('/:id/cancel', requireManager, validateParams(idParamSchema), requestsController.cancelRequest);

export default router;
