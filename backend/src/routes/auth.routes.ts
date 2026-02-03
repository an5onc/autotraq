import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, barcodeLoginSchema, adminCreateUserSchema, roleRequestSchema, roleDecisionSchema, changePasswordSchema, adminResetPasswordSchema } from '../schemas/auth.schema.js';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/barcode-login', validateBody(barcodeLoginSchema), authController.barcodeLogin);

// Authenticated routes
router.get('/me', authenticate, authController.me);
router.get('/my-barcode', authenticate, authController.getMyBarcode);

// Password management
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

// Role requests (any authenticated user can request)
router.post('/role-requests', authenticate, validateBody(roleRequestSchema), authController.requestRole);

// Admin-only routes
router.post('/users', authenticate, requireAdmin, validateBody(adminCreateUserSchema), authController.adminCreateUser);
router.get('/users', authenticate, requireAdmin, authController.listUsers);
router.get('/role-requests', authenticate, requireAdmin, authController.listRoleRequests);
router.post('/role-requests/:id/decide', authenticate, requireAdmin, validateBody(roleDecisionSchema), authController.decideRoleRequest);
router.post('/users/:userId/regenerate-barcode', authenticate, requireAdmin, authController.regenerateBarcode);
router.post('/users/:userId/reset-password', authenticate, requireAdmin, validateBody(adminResetPasswordSchema), authController.adminResetPassword);
router.delete('/users/:userId', authenticate, requireAdmin, authController.deleteUser);

export default router;
