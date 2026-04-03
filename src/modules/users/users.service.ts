import { Role, Status } from '../../types/enums';
import { prisma } from '../../config/prisma';

const select = {
  id: true, name: true, email: true,
  role: true, status: true,
  createdAt: true, updatedAt: true,
};

// ─── list ────────────────────────────────────────────────────────────────────

export async function listUsers(params: {
  page: number; limit: number;
  role?: Role; status?: Status; search?: string;
}) {
  const { page, limit, role, status, search } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (role)   where.role   = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name:  { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

// ─── get one ─────────────────────────────────────────────────────────────────

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select });
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
}

// ─── update profile ──────────────────────────────────────────────────────────

export async function updateUser(id: string, data: { name?: string; email?: string }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (data.email && data.email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email: data.email } });
    if (taken) throw { status: 409, message: 'Email is already in use by another account' };
  }

  return prisma.user.update({ where: { id }, data, select });
}

// ─── update role ─────────────────────────────────────────────────────────────

export async function updateRole(id: string, role: Role, requesterId: string) {
  if (id === requesterId) throw { status: 400, message: 'You cannot change your own role' };
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'User not found' };
  return prisma.user.update({ where: { id }, data: { role }, select });
}

// ─── update status ───────────────────────────────────────────────────────────

export async function updateStatus(id: string, status: Status, requesterId: string) {
  if (id === requesterId) throw { status: 400, message: 'You cannot deactivate your own account' };
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'User not found' };
  return prisma.user.update({ where: { id }, data: { status }, select });
}

// ─── delete ──────────────────────────────────────────────────────────────────

export async function deleteUser(id: string, requesterId: string) {
  if (id === requesterId) throw { status: 400, message: 'You cannot delete your own account' };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'User not found' };

  const count = await prisma.financialRecord.count({ where: { createdBy: id } });
  if (count > 0) {
    throw {
      status: 400,
      message: `Cannot delete user — they own ${count} financial record(s). Deactivate the account instead.`,
    };
  }

  await prisma.user.delete({ where: { id } });
}
