import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import { RegisterInput, LoginInput, AdminCreateUserInput, BarcodeLoginInput, RoleRequestInput, RoleDecisionInput, ChangePasswordInput, AdminResetPasswordInput } from '../schemas/auth.schema.js';
import { success, created, validationError, forbidden, serverError } from '../utils/response.js';

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);
    created(res, result);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Email already registered' || err.message === 'Cannot self-register as admin or manager')) {
      validationError(res, err.message, { email: err.message });
      return;
    }
    console.error('Register error:', err);
    serverError(res);
  }
}

export async function adminCreateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const input: AdminCreateUserInput = req.body;
    const result = await authService.adminCreateUser(input, req.user!.userId);
    created(res, result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Email already registered' || err.message.startsWith('Maximum of')) {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Admin create user error:', err);
    serverError(res);
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const input: LoginInput = req.body;
    const result = await authService.login(input);
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Invalid email or password' || err.message === 'Admin and manager accounts must use barcode login') {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Login error:', err);
    serverError(res);
  }
}

export async function barcodeLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const { barcode }: BarcodeLoginInput = req.body;
    const result = await authService.barcodeLogin(barcode);
    success(res, result);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Invalid barcode' || err.message.includes('only for admin'))) {
      validationError(res, err.message);
      return;
    }
    console.error('Barcode login error:', err);
    serverError(res);
  }
}

export async function getMyBarcode(req: AuthenticatedRequest, res: Response) {
  try {
    const barcode = await authService.getUserBarcode(req.user!.userId);
    success(res, { barcode });
  } catch (err) {
    console.error('Get barcode error:', err);
    serverError(res);
  }
}

export async function regenerateBarcode(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const barcode = await authService.regenerateBarcode(userId);
    success(res, { barcode });
  } catch (err) {
    if (err instanceof Error) {
      validationError(res, err.message);
      return;
    }
    console.error('Regenerate barcode error:', err);
    serverError(res);
  }
}

export async function requestRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { requestedRole, reason }: RoleRequestInput = req.body;
    const result = await authService.requestRolePromotion(req.user!.userId, requestedRole, reason);
    created(res, result);
  } catch (err) {
    if (err instanceof Error) {
      validationError(res, err.message);
      return;
    }
    console.error('Role request error:', err);
    serverError(res);
  }
}

export async function listRoleRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const requests = await authService.listRoleRequests(status);
    success(res, requests);
  } catch (err) {
    console.error('List role requests error:', err);
    serverError(res);
  }
}

export async function decideRoleRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const requestId = parseInt(req.params.id);
    const { approved }: RoleDecisionInput = req.body;
    const result = await authService.decideRoleRequest(requestId, approved, req.user!.userId);
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      validationError(res, err.message);
      return;
    }
    console.error('Decide role request error:', err);
    serverError(res);
  }
}

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await authService.listUsers();
    success(res, users);
  } catch (err) {
    console.error('List users error:', err);
    serverError(res);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { currentPassword, newPassword }: ChangePasswordInput = req.body;
    const result = await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    success(res, result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Current password is incorrect') {
      validationError(res, err.message);
      return;
    }
    console.error('Change password error:', err);
    serverError(res);
  }
}

export async function adminResetPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { newPassword }: AdminResetPasswordInput = req.body;
    const result = await authService.adminResetPassword(userId, newPassword);
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      validationError(res, err.message);
      return;
    }
    console.error('Admin reset password error:', err);
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
