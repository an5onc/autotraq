import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

function generateShortBarcode(): string {
  return randomBytes(4).toString('hex').toUpperCase(); // 8 chars, e.g. 'A3F2B91C'
}
import prisma from '../repositories/prisma.js';
import { RegisterInput, AdminCreateUserInput, LoginInput } from '../schemas/auth.schema.js';
import { JwtPayload } from '../middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;
const MAX_ADMINS = 4;

export interface AuthResult {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

// Self-registration (fulfillment/viewer only)
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const role = input.role || 'viewer';

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = generateToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return { user, token };
}

// Admin creates a user (any role, including admin)
export async function adminCreateUser(input: AdminCreateUserInput, createdById: number): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Enforce admin cap
  if (input.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount >= MAX_ADMINS) {
      throw new Error(`Maximum of ${MAX_ADMINS} admin users allowed`);
    }
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Generate barcode for admin and manager
  const loginBarcode = (input.role === 'admin' || input.role === 'manager')
    ? generateShortBarcode()
    : null;

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role,
      loginBarcode,
      createdById,
    },
    select: { id: true, email: true, name: true, role: true, loginBarcode: true },
  });

  const token = generateToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}

// Email/password login
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Admin & manager must use barcode login
  if (user.role === 'admin' || user.role === 'manager') {
    throw new Error('Admin and manager accounts must use barcode login');
  }

  const validPassword = await bcrypt.compare(input.password, user.password);
  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

// Barcode login (admin & manager only)
export async function barcodeLogin(barcode: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { loginBarcode: barcode },
  });
  if (!user) {
    throw new Error('Invalid barcode');
  }
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('Barcode login is only for admin and manager accounts');
  }

  const token = generateToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

// Get user's barcode (admin/manager only, for displaying their own barcode)
export async function getUserBarcode(userId: number): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginBarcode: true, role: true },
  });
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return null;
  }
  return user.loginBarcode;
}

// Regenerate barcode for a user (admin only)
export async function regenerateBarcode(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('Barcode login is only for admin and manager accounts');
  }
  const newBarcode = generateShortBarcode();
  await prisma.user.update({
    where: { id: userId },
    data: { loginBarcode: newBarcode },
  });
  return newBarcode;
}

// Request role promotion (to manager)
export async function requestRolePromotion(userId: number, requestedRole: string, reason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.role === 'admin' || user.role === 'manager') {
    throw new Error('You already have this role or higher');
  }
  if (requestedRole !== 'manager') {
    throw new Error('Can only request promotion to manager');
  }

  // Check for existing pending request
  const existing = await prisma.roleRequest.findFirst({
    where: { userId, status: 'PENDING' },
  });
  if (existing) {
    throw new Error('You already have a pending role request');
  }

  return prisma.roleRequest.create({
    data: { userId, requestedRole: 'manager', reason },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });
}

// List pending role requests (admin only)
export async function listRoleRequests(status?: string) {
  const where = status ? { status: status as any } : {};
  return prisma.roleRequest.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      decidedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Approve or deny a role request (admin only)
export async function decideRoleRequest(requestId: number, approved: boolean, decidedById: number) {
  const roleRequest = await prisma.roleRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!roleRequest) throw new Error('Role request not found');
  if (roleRequest.status !== 'PENDING') throw new Error('Role request already decided');

  if (approved) {
    // Generate barcode for newly promoted manager
    const loginBarcode = generateShortBarcode();

    await prisma.$transaction([
      prisma.roleRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', decidedById, decidedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: roleRequest.userId },
        data: { role: roleRequest.requestedRole, loginBarcode },
      }),
    ]);
  } else {
    await prisma.roleRequest.update({
      where: { id: requestId },
      data: { status: 'DENIED', decidedById, decidedAt: new Date() },
    });
  }

  return prisma.roleRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });
}

// List all users (admin only)
export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true, loginBarcode: true, createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Change own password
export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error('Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { message: 'Password changed successfully' };
}

// Admin reset any user's password
export async function adminResetPassword(targetUserId: number, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new Error('User not found');

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: targetUserId }, data: { password: hashed } });
  return { message: 'Password reset successfully' };
}

// Admin delete user (cannot delete yourself)
export async function deleteUser(targetUserId: number, requestingUserId: number) {
  if (targetUserId === requestingUserId) {
    throw new Error('Cannot delete your own account');
  }
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new Error('User not found');

  // Reassign all activity to the admin performing the delete
  await prisma.$transaction([
    // Reassign inventory events
    prisma.inventoryEvent.updateMany({ where: { createdBy: targetUserId }, data: { createdBy: requestingUserId } }),
    // Reassign requests they created
    prisma.request.updateMany({ where: { createdBy: targetUserId }, data: { createdBy: requestingUserId } }),
    // Reassign requests they approved/fulfilled
    prisma.request.updateMany({ where: { approvedBy: targetUserId }, data: { approvedBy: requestingUserId } }),
    prisma.request.updateMany({ where: { fulfilledBy: targetUserId }, data: { fulfilledBy: requestingUserId } }),
    // Clear user-creator references
    prisma.user.updateMany({ where: { createdById: targetUserId }, data: { createdById: null } }),
    // Clear role requests
    prisma.roleRequest.deleteMany({ where: { userId: targetUserId } }),
    prisma.roleRequest.updateMany({ where: { decidedById: targetUserId }, data: { decidedById: null } }),
    // Delete the user
    prisma.user.delete({ where: { id: targetUserId } }),
  ]);

  return { message: `User "${user.name}" deleted. Their activity has been reassigned to you.` };
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new Error('User not found');
  return user;
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}
