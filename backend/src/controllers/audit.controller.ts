import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as auditService from '../services/audit.service.js';
import { success, serverError } from '../utils/response.js';

export async function getLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      entityType,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await auditService.getLogs({
      entityType: entityType as string | undefined,
      entityId: entityId ? parseInt(entityId as string) : undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      action: action as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    success(res, result);
  } catch (err) {
    console.error('Get audit logs error:', err);
    serverError(res);
  }
}

export async function getEntityHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { entityType, entityId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const logs = await auditService.getEntityHistory(entityType, parseInt(entityId), limit);
    success(res, logs);
  } catch (err) {
    console.error('Get entity history error:', err);
    serverError(res);
  }
}
