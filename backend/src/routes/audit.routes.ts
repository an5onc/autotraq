import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';

const router = Router();

// All audit routes require authentication and manager+ role
router.use(authenticate);
router.use(requireManager);

// GET /api/audit - Query audit logs
router.get('/', auditController.getLogs);

// GET /api/audit/:entityType/:entityId - Get history for specific entity
router.get('/:entityType/:entityId', auditController.getEntityHistory);

export default router;
