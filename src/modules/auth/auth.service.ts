import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt';
import { sendResetEmail } from '../../utils/email';

// ─── helpers ────────────────────────────────────────────────────────────────

function tokens(userId: string, role: string) {
  return {
    accessToken:  signAccess({ userId, role }),
    refreshToken: signRefresh({ userId, role }),
  };
}

// ─── register ───────────────────────────────────────────────────────────────

export async function register(name: string, email: string, password: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw { status: 409, message: 'An account with this email already exists' };

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return { user, ...tokens(user.id, user.role) };
}

// ─── login ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  if (user.status === 'INACTIVE') {
    throw { status: 403, message: 'Your account has been deactivated. Contact an administrator.' };
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  return { user: safeUser, ...tokens(user.id, user.role) };
}

// ─── refresh token ──────────────────────────────────────────────────────────

export async function refreshTokens(token: string) {
  let decoded: { userId: string; role: string };
  try {
    decoded = verifyRefresh(token);
  } catch {
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user)                    throw { status: 401, message: 'User not found' };
  if (user.status === 'INACTIVE') throw { status: 403, message: 'Account is inactive' };

  return tokens(user.id, user.role);
}

// ─── forgot password ────────────────────────────────────────────────────────

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent — no email enumeration

  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetExpiry: expiry },
  });

  await sendResetEmail(user.email, user.name, token);
}

// ─── reset password ─────────────────────────────────────────────────────────

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetExpiry: { gt: new Date() } },
  });

  if (!user) throw { status: 400, message: 'Reset token is invalid or has expired' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetExpiry: null },
  });
}

// ─── change password (authenticated) ────────────────────────────────────────

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw { status: 400, message: 'Current password is incorrect' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

// ─── profile ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
}
