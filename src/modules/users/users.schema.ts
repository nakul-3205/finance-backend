import { z } from 'zod';
import { Role, Status } from '../../types/enums';

export const updateUserSchema = z.object({
  name:  z.string().min(2).max(80).optional(),
  email: z.string().email('Invalid email').optional(),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Role must be VIEWER, ANALYST, or ADMIN' }),
  }),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(Status, {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

export const listUsersQuerySchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(20),
  role:   z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),
  search: z.string().optional(),
});
