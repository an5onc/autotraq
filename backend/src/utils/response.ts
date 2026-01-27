import { Response } from 'express';

/**
 * Standard API response format per CLAUDE.md Section 4
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export function success<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}

export function created<T>(res: Response, data: T): void {
  success(res, data, 201);
}

export function error(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: Record<string, string>
): void {
  const errorResponse: ApiResponse<never> = {
    error: { code, message, ...(details && { details }) },
  };
  res.status(status).json(errorResponse);
}

export function validationError(
  res: Response,
  message: string,
  details?: Record<string, string>
): void {
  error(res, 'VALIDATION_ERROR', message, 400, details);
}

export function notFound(res: Response, message = 'Resource not found'): void {
  error(res, 'NOT_FOUND', message, 404);
}

export function unauthorized(res: Response, message = 'Unauthorized'): void {
  error(res, 'UNAUTHORIZED', message, 401);
}

export function forbidden(res: Response, message = 'Forbidden'): void {
  error(res, 'FORBIDDEN', message, 403);
}

export function serverError(res: Response, message = 'Internal server error'): void {
  error(res, 'SERVER_ERROR', message, 500);
}
