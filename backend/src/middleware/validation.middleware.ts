import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { validationError } from '../utils/response.js';

/**
 * Middleware factory to validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          details[path] = e.message;
        });
        validationError(res, 'Validation failed', details);
        return;
      }
      throw err;
    }
  };
}

/**
 * Middleware factory to validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          details[path] = e.message;
        });
        validationError(res, 'Invalid query parameters', details);
        return;
      }
      throw err;
    }
  };
}

/**
 * Middleware factory to validate route parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          details[path] = e.message;
        });
        validationError(res, 'Invalid route parameters', details);
        return;
      }
      throw err;
    }
  };
}
