import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as notificationsService from '../services/notifications.service.js';
import { success, serverError } from '../utils/response.js';

/**
 * GET /api/notifications - Get notifications for current user
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const unreadOnly = req.query.unread === 'true';
    
    const notifications = await notificationsService.getForUser(req.user!.userId, { limit, unreadOnly });
    success(res, notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    serverError(res);
  }
}

/**
 * GET /api/notifications/count - Get unread count
 */
export async function getUnreadCount(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await notificationsService.getUnreadCount(req.user!.userId);
    success(res, { count });
  } catch (err) {
    console.error('Get unread count error:', err);
    serverError(res);
  }
}

/**
 * PATCH /api/notifications/:id/read - Mark notification as read
 */
export async function markRead(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await notificationsService.markRead(id, req.user!.userId);
    success(res, { read: true });
  } catch (err) {
    console.error('Mark read error:', err);
    serverError(res);
  }
}

/**
 * POST /api/notifications/read-all - Mark all as read
 */
export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await notificationsService.markAllRead(req.user!.userId);
    success(res, { marked: result.count });
  } catch (err) {
    console.error('Mark all read error:', err);
    serverError(res);
  }
}
