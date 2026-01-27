import { Request, Response, NextFunction } from 'express';
import { serverError } from '../utils/response.js';

/**
 * Global error handler middleware
 * Logs errors and returns a standardized error response
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with request context (per CLAUDE.md Section 6)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    route: req.path,
    method: req.method,
  });

  serverError(res, process.env.NODE_ENV === 'development' ? err.message : 'Internal server error');
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
