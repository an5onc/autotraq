import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
import { success, created, validationError, serverError } from '../utils/response.js';

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);
    created(res, result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Email already registered') {
      validationError(res, err.message, { email: 'Email is already in use' });
      return;
    }
    console.error('Register error:', err);
    serverError(res);
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const input: LoginInput = req.body;
    const result = await authService.login(input);
    success(res, result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid email or password') {
      validationError(res, err.message);
      return;
    }
    console.error('Login error:', err);
    serverError(res);
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const user = await authService.getCurrentUser(req.user.userId);
    success(res, user);
  } catch (err) {
    console.error('Get current user error:', err);
    serverError(res);
  }
}
