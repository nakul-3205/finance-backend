import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role: string;
}

function secret(key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const val = process.env[key];
  if (!val) throw new Error(`${key} is not set in environment`);
  return val;
}

export function signAccess(payload: JwtPayload): string {
  return jwt.sign(payload, secret('JWT_SECRET'), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'],
  });
}

export function signRefresh(payload: JwtPayload): string {
  return jwt.sign(payload, secret('JWT_REFRESH_SECRET'), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, secret('JWT_SECRET')) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, secret('JWT_REFRESH_SECRET')) as JwtPayload;
}
