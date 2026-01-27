import { Router } from 'express';
import * as interchangeController from '../controllers/interchange.controller.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';
import {
  createInterchangeGroupSchema,
  addGroupMemberSchema,
  groupIdParamSchema,
  memberParamSchema,
} from '../schemas/interchange.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/interchange-groups - Create group (manager+)
router.post('/', requireManager, validateBody(createInterchangeGroupSchema), interchangeController.createGroup);

// GET /api/interchange-groups - List groups (all authenticated users)
router.get('/', interchangeController.getGroups);

// GET /api/interchange-groups/:id - Get group by ID (all authenticated users)
router.get('/:id', validateParams(groupIdParamSchema), interchangeController.getGroupById);

// POST /api/interchange-groups/:id/members - Add part to group (manager+)
router.post(
  '/:id/members',
  requireManager,
  validateParams(groupIdParamSchema),
  validateBody(addGroupMemberSchema),
  interchangeController.addMember
);

// DELETE /api/interchange-groups/:id/members/:partId - Remove part from group (manager+)
router.delete(
  '/:id/members/:partId',
  requireManager,
  validateParams(memberParamSchema),
  interchangeController.removeMember
);

// GET /api/parts/:partId/interchangeable - Get interchangeable parts for a part
// Note: This is mounted separately in the main routes file

export default router;
