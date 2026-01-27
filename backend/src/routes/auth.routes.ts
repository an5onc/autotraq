import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', validateBody(registerSchema), authController.register);

// POST /api/auth/login - Login and get JWT
router.post('/login', validateBody(loginSchema), authController.login);

// GET /api/auth/me - Get current authenticated user
router.get('/me', authenticate, authController.me);

export default router;
