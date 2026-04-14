import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Supplier management routes are stubs — Supplier model is not yet in the schema.
// All endpoints return 501 until the schema is extended with Supplier, PurchaseOrder models.

router.get('/', authenticate, (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

router.get('/:id', authenticate, (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

router.post('/', authenticate, requireRoles('admin', 'manager'), (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

router.put('/:id', authenticate, requireRoles('admin', 'manager'), (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

router.delete('/:id', authenticate, requireRoles('admin'), (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

router.get('/:id/performance', authenticate, (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

router.post('/:id/purchase-orders', authenticate, requireRoles('admin', 'manager'), (_req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Supplier management not yet implemented' });
});

export default router;
