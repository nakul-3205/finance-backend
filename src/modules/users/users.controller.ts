import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as svc from './users.service';
import { ok, fail } from '../../utils/response';
import { Role, Status } from '../../types/enums';

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const { page, limit, role, status, search } = req.query as Record<string, string | undefined>;
    const result = await svc.listUsers({
      page:   Number(page  ?? 1),
      limit:  Number(limit ?? 20),
      role:   role   as Role   | undefined,
      status: status as Status | undefined,
      search,
    });
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch users', e.status ?? 500);
  }
}

export async function getUser(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.getUserById(req.params.id));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch user', e.status ?? 500);
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.updateUser(req.params.id, req.body), 'User updated');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to update user', e.status ?? 500);
  }
}

export async function updateRole(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.updateRole(req.params.id, req.body.role, req.user!.id), 'Role updated');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to update role', e.status ?? 500);
  }
}

export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.updateStatus(req.params.id, req.body.status, req.user!.id), 'Status updated');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to update status', e.status ?? 500);
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    await svc.deleteUser(req.params.id, req.user!.id);
    return ok(res, null, 'User deleted');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to delete user', e.status ?? 500);
  }
}
