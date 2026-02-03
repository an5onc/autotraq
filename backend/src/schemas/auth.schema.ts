import { z } from 'zod';

// Self-registration: only fulfillment or viewer
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['fulfillment', 'viewer']).optional(),
});

// Admin creating users (can set any role including admin)
export const adminCreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['admin', 'manager', 'fulfillment', 'viewer']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Barcode login for admin/manager
export const barcodeLoginSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
});

// Role promotion request
export const roleRequestSchema = z.object({
  requestedRole: z.enum(['manager']),
  reason: z.string().max(500).optional(),
});

// Admin decision on role request
export const roleDecisionSchema = z.object({
  approved: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BarcodeLoginInput = z.infer<typeof barcodeLoginSchema>;
export type RoleRequestInput = z.infer<typeof roleRequestSchema>;
// Change own password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Admin reset password
export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RoleDecisionInput = z.infer<typeof roleDecisionSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
