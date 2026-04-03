import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as svc from './auth.service';
import { ok, fail } from '../../utils/response';

export async function register(req: Request, res: Response) {
  try {
    const result = await svc.register(req.body.name, req.body.email, req.body.password);
    return ok(res, result, 'Account created successfully', 201);
  } catch (e: any) {
    return fail(res, e.message ?? 'Registration failed', e.status ?? 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await svc.login(req.body.email, req.body.password);
    return ok(res, result, 'Login successful');
  } catch (e: any) {
    return fail(res, e.message ?? 'Login failed', e.status ?? 500);
  }
}

export function logout(_req: Request, res: Response) {
  // JWT is stateless — the client must discard both tokens.
  return ok(res, null, 'Logged out successfully');
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const result = await svc.refreshTokens(req.body.refreshToken);
    return ok(res, result, 'Token refreshed');
  } catch (e: any) {
    return fail(res, e.message ?? 'Could not refresh token', e.status ?? 500);
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    await svc.forgotPassword(req.body.email);
    return ok(res, null, 'If an account with that email exists, a reset link has been sent');
  } catch (e: any) {
    return fail(res, e.message ?? 'Something went wrong', e.status ?? 500);
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    await svc.resetPassword(req.body.token, req.body.password);
    return ok(res, null, 'Password has been reset. You can now log in.');
  } catch (e: any) {
    return fail(res, e.message ?? 'Password reset failed', e.status ?? 500);
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    await svc.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    return ok(res, null, 'Password updated successfully');
  } catch (e: any) {
    return fail(res, e.message ?? 'Password change failed', e.status ?? 500);
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await svc.getProfile(req.user!.id);
    return ok(res, user);
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch profile', e.status ?? 500);
  }
}
