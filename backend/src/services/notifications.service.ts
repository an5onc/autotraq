import prisma from '../repositories/prisma.js';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification for a user
 */
export async function create(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
  });
}

/**
 * Create notifications for multiple users
 */
export async function createForUsers(userIds: number[], input: Omit<CreateNotificationInput, 'userId'>) {
  return prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    })),
  });
}

/**
 * Create notifications for users with specific roles
 */
export async function createForRoles(roles: string[], input: Omit<CreateNotificationInput, 'userId'>) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles as any } },
    select: { id: true },
  });
  
  if (users.length === 0) return { count: 0 };
  
  return prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    })),
  });
}

/**
 * Get notifications for a user
 */
export async function getForUser(userId: number, options?: { limit?: number; unreadOnly?: boolean }) {
  const { limit = 50, unreadOnly = false } = options || {};
  
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/**
 * Mark a notification as read
 */
export async function markRead(notificationId: number, userId: number) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOld(daysOld: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  return prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      read: true, // Only delete read notifications
    },
  });
}

// ============================================
// Helper functions for common notification types
// ============================================

export async function notifyLowStock(partId: number, partName: string, sku: string, quantity: number, minStock: number) {
  // Notify managers and admins
  return createForRoles(['admin', 'manager'], {
    type: 'LOW_STOCK',
    title: 'Low Stock Alert',
    message: `${partName} (${sku}) is low on stock: ${quantity}/${minStock} remaining`,
    link: `/parts/${partId}`,
  });
}

export async function notifyRequestApproved(userId: number, requestId: number) {
  return create({
    userId,
    type: 'REQUEST_APPROVED',
    title: 'Request Approved',
    message: 'Your parts request has been approved and is ready for fulfillment.',
    link: `/requests?id=${requestId}`,
  });
}

export async function notifyRequestDenied(userId: number, requestId: number, reason?: string) {
  return create({
    userId,
    type: 'REQUEST_DENIED',
    title: 'Request Denied',
    message: reason ? `Your request was denied: ${reason}` : 'Your parts request was denied.',
    link: `/requests?id=${requestId}`,
  });
}

export async function notifyRoleApproved(userId: number, newRole: string) {
  return create({
    userId,
    type: 'ROLE_APPROVED',
    title: 'Role Request Approved',
    message: `Congratulations! You've been promoted to ${newRole}.`,
  });
}

export async function notifyRoleRejected(userId: number, requestedRole: string, reason?: string) {
  return create({
    userId,
    type: 'ROLE_DENIED',
    title: 'Role Request Denied',
    message: reason ? `Your request for ${requestedRole} was denied: ${reason}` : `Your request for ${requestedRole} was denied.`,
  });
}
