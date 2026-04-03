import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums';
import { verifyAccess } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { fail } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    fail(res, 'Authentication required', 401);
    return;
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccess(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user) {
      fail(res, 'User not found', 401);
      return;
    }

    if (user.status === 'INACTIVE') {
      fail(res, 'Your account has been deactivated', 403);
      return;
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch {
    fail(res, 'Invalid or expired token', 401);
  }
}
