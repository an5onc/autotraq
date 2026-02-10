import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { unauthorized, forbidden } from '../utils/response.js';

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    unauthorized(res, 'Missing or invalid authorization header');
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    unauthorized(res, 'Invalid or expired token');
  }
}

/**
 * Middleware factory to check if user has one of the allowed roles
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
      return;
    }

    next();
  };
}

/**
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = requireRoles('admin');

/**
 * Convenience middleware for manager+ routes
 */
export const requireManager = requireRoles('admin', 'manager');

/**
 * Convenience middleware for fulfillment+ routes
 */
export const requireFulfillment = requireRoles('admin', 'manager', 'fulfillment');
