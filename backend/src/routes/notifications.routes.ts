import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as notificationsController from '../controllers/notifications.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get notifications for current user
router.get('/', notificationsController.getNotifications);

// GET /api/notifications/count - Get unread count
router.get('/count', notificationsController.getUnreadCount);

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', notificationsController.markAllRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', notificationsController.markRead);

export default router;
